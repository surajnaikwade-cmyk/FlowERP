 --DISPATCHES

CREATE TABLE dispatches (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dispatch_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id INTEGER NOT NULL,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_dispatch_sales_order
        UNIQUE (sales_order_id),

    CONSTRAINT fk_dispatch_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
        ON DELETE RESTRICT
);
 
--DISPATCH ITEMS

CREATE TABLE dispatch_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dispatch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_dispatch_item_dispatch
        FOREIGN KEY (dispatch_id)
        REFERENCES dispatches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispatch_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_dispatch_product
        UNIQUE (dispatch_id, product_id)
);