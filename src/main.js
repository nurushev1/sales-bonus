/**
 * Функция для расчета выручки
 * @param {Object} purchase запись о покупке
 * @param {Object} _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;

   const discountDecimal = discount / 100;
   const fullPrice = sale_price * quantity;
   const revenue = fullPrice * (1 - discountDecimal);

   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param {number} index порядковый номер в отсортированном массиве
 * @param {number} total общее число продавцов
 * @param {Object} seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Опции не переданы или имеют неверный формат');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы функции расчёта выручки или бонусов');
    }

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Переданные параметры должны быть функциями');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
}));
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
    sellerStats.map(seller => [seller.seller_id, seller])
);
    const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
);
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
    
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Получаем объект товара
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            const revenue = options.calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.revenue += revenue;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
    });
});
    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = sellerStats.slice().sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
   sortedSellers.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sortedSellers.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    
    seller.revenue = +seller.revenue.toFixed(2);
    seller.profit = +seller.profit.toFixed(2);
});
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: seller.revenue,
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
