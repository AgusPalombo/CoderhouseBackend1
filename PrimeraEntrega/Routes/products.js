const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');

const productsFilePath = path.join(__dirname, '../Data/products.json');

// Función para leer los productos del archivo
const getProducts = () => {
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    return JSON.parse(data);
};

// Función para guardar los productos en el archivo
const saveProducts = (products) => {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
};

// Obtener todos los productos
router.get('/', (req, res) => {
    const products = getProducts();
    const limit = req.query.limit ? parseInt(req.query.limit) : products.length;
    res.json(products.slice(0, limit));
});

// Obtener un producto por ID
router.get('/:pid', (req, res) => {
    const products = getProducts();
    const product = products.find(p => p.id === parseInt(req.params.pid));
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
});

// Función para generar un ID aleatorio
function generateId() {
    return Math.floor(Math.random() * 10000); // ID aleatorio entre 0 y 9999
  }
  

// Crear un nuevo producto
router.post('/', (req, res) => {
    const products = getProducts();
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body;

    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios, excepto thumbnails' });
    }

    const newProduct = {
        id: generateId(), 
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails
    };

    products.push(newProduct);
    saveProducts(products);
    res.status(201).json(newProduct);
});

// Actualizar un producto
router.put('/:pid', (req, res) => {
    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.pid));

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { id, ...rest } = req.body; // No se puede actualizar el ID
    products[productIndex] = { ...products[productIndex], ...rest };

    saveProducts(products);
    res.json(products[productIndex]);
});

// Eliminar un producto
router.delete('/:pid', (req, res) => {
    const products = getProducts();
    const filteredProducts = products.filter(p => p.id !== parseInt(req.params.pid));

    if (filteredProducts.length === products.length) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    saveProducts(filteredProducts);
    res.status(204).end();
});

module.exports = router;
