--ENQUIRIES

CREATE TABLE enquiries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enquiry_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enquiry_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_enquiry_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_required_date
        CHECK (required_date IS NULL OR required_date >= enquiry_date)
);

--ENQUIRY ITEMS
  
CREATE TABLE enquiry_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enquiry_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_enquiry_item_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enquiry_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_enquiry_product
        UNIQUE (enquiry_id, product_id)
);