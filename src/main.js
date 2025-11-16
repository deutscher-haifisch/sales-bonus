/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции

    const { discount, sale_price, quantity } = purchase;

    const discountFactor = 1 - discount / 100;

    return sale_price * quantity * discountFactor;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    const { profit } = seller;

    let percent = 0;

    if (index === 0) {
        // Первый в рейтинге
        percent = 15;
    } else if (index === 1 || index === 2) {
        // Второй и третий
        percent = 10;
    } else if (index === total - 1) {
        // Последний
        percent = 0;
    } else {
        // Все остальные
        percent = 5;
    }

    return profit * (percent / 100);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями

    if (!data || typeof data !== 'object') {
        throw new Error('Некорректные данные: ожидается объект data');
    }

    const { sellers, products, purchase_records } = data;

    if (!Array.isArray(sellers) || sellers.length === 0) {
        throw new Error('Отсутствуют данные о продавцах');
    }
    if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Отсутствуют данные о товарах');
    }
    if (!Array.isArray(purchase_records) || purchase_records.length === 0) {
        throw new Error('Отсутствуют данные о продажах (purchase_records)');
    }

    // --- Проверка наличия опций ---
    if (!options || typeof options !== 'object') {
        throw new Error('Не переданы опции (options)');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('В опциях должны быть функции calculateRevenue и calculateBonus');
    }

    // --- Подготовка промежуточных данных для сбора статистики ---
    const sellerStats = sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}, // временная структура для подсчета проданных товаров
        bonus: 0,
        top_products: []
    }));

    // --- Индексация продавцов и товаров для быстрого доступа ---
    const sellerIndex = {};
    sellerStats.forEach(stat => {
        sellerIndex[stat.seller_id] = stat;
    });

    const productIndex = {};
    products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // --- Расчет выручки и прибыли для каждого продавца ---
    purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) {
            // На всякий случай: если в данных вдруг нет продавца с таким id
            return;
        }

        // Увеличить количество продаж
        seller.sales_count += 1;

        // Увеличить общую сумму всех продаж (без скидок, как в задаче: total_amount)
        seller.revenue += record.total_amount;

        // Перебираем товары в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) {
                return;
            }

            // Себестоимость = закупочная цена * количество
            const cost = product.purchase_price * item.quantity;

            // Выручка с учётом скидки
            const revenue = calculateRevenue(item, product);

            // Прибыль = выручка - себестоимость
            const profit = revenue - cost;

            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // --- Сортировка продавцов по прибыли (по убыванию) ---
    sellerStats.sort((a, b) => b.profit - a.profit);

    // --- Назначение премий и формирование топ-10 товаров ---
    sellerStats.forEach((seller, index) => {
        // Бонус по позиции
        seller.bonus = calculateBonus(index, sellerStats.length, seller);

        // Преобразуем products_sold в массив и берём топ-10 по количеству
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // products_sold — внутренняя структура, в итог не нужна
        delete seller.products_sold;
    });

    // --- Подготовка итоговой коллекции с нужными полями ---
    return sellerStats;
}
