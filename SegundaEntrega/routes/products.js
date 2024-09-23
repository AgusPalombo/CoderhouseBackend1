const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const productsFilePath = path.join(__dirname, '../data/products.json');

// Función para leer los productos del archivo
const getProducts = () => {
    if (fs.existsSync(productsFilePath)) {
        const data = fs.readFileSync(productsFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return [];
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

// Crear un nuevo producto
router.post('/', (req, res) => {
    const products = getProducts();
    const { title, description, price, stock, category, thumbnails = [] } = req.body;

    if (!title || !description || !price || !stock || !category) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el producto ya existe
    const existingProduct = products.find(p => p.title === title);
    if (existingProduct) {
        existingProduct.stock += 1; // Aumentar stock en 1
        saveProducts(products);
        return res.status(200).json(existingProduct); // Devolver el producto actualizado
    }

    const newProduct = {
        id: products.length ? products[products.length - 1].id + 1 : 1,
        title,
        description,
        price,
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

    const { id, ...rest } = req.body;
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

// Exportar las funciones necesarias
const agregarProducto = (producto) => {
    const products = getProducts();
    const newProduct = {
        id: products.length ? products[products.length - 1].id + 1 : 1,
        ...producto,
    };
    products.push(newProduct);
    saveProducts(products);
};

const eliminarProducto = (id) => {
    const products = getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    saveProducts(filteredProducts);
};

module.exports = {
    router,
    agregarProducto,
    eliminarProducto,
    getProducts,
};
