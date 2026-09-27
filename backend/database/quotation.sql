--QUOTATIONS

CREATE TABLE quotations (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    enquiry_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quotation_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_quotation_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_quotation_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_quotation_valid_until
        CHECK (valid_until >= CURRENT_DATE)
);
 
--QUOTATION ITEMS

CREATE TABLE quotation_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL
        CHECK (unit_price >= 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    gst_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (gst_percent >= 0 AND gst_percent <= 100),
    line_amount NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (line_amount >= 0),

    CONSTRAINT fk_quotation_item_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quotation_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_quotation_product
        UNIQUE (quotation_id, product_id)
);