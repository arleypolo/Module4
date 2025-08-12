// Import required modules
import express, { json } from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import multer from 'multer';
import fs from 'fs';
import { parse } from 'csv-parse';

const app = express();
app.use(cors());
app.use(json());

// MySQL connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'polociro',
    database: 'ExpertSoft'
});

// Get all customers
app.get('/customers', (req, res) => {
    db.query('SELECT * FROM customer', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get customer by ID
app.get('/customers/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

// Add new customer
app.post('/customers', async (req, res) => {
    const { name, id_customer, address, phone, email } = req.body;
    try {
        db.query(
            'INSERT INTO customer (name, id_customer, address, phone, email) VALUES (?, ?, ?, ?, ?)',
            [name, id_customer, address, phone, email]
        );
        res.json({ message: 'Customer added' });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update customer by ID
app.put('/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, id_customer, address, phone, email } = req.body;
    try {
        const result = db.query(
            'UPDATE customer SET name = ?, id_customer = ?, address = ?, phone = ?, email = ? WHERE id = ?',
            [name, id_customer, address, phone, email, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer updated' });
    } catch (err) {
        res.status(500).json(err);
    }
});

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// Upload customers from CSV file
app.post('/customers/upload-csv', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const results = [];
    fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, delimiter: ';' }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (const row of results) {
                    db.query(
                        'INSERT INTO customer (name, id_customer, address, phone, email) VALUES (?, ?, ?, ?, ?)',
                        [row.name, row.id_customer, row.address, row.phone, row.email]
                    );
                }
                fs.unlinkSync(filePath); // Delete temp file
                res.json({ message: 'CSV uploaded successfully' });
            } catch (err) {
                res.status(500).json({ error: 'Error inserting data' });
            }
        });
});

// Delete customer by ID
app.delete('/customer/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = db.query('DELETE FROM customer WHERE id = ?', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get total paid by each customer
app.get('/customers/total-paid', async (req, res) => {
    try {
        db.query(`
            SELECT 
                c.id AS customer_id,
                c.name AS customer_name,
                SUM(b.amount_paid) AS total_paid
            FROM bill b
            JOIN customer c ON b.id_customer = c.id
            GROUP BY c.id, c.name;
        `, (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error fetching totals' });
            res.json(rows);
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching totals' });
    }
});

// Start server
app.listen(3000, () => console.log('Server running at http://localhost:3000'))