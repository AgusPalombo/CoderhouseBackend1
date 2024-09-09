const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ruta al archivo de carritos
const cartsFilePath = path.join(__dirname, '../Data/carts.json');
const productsFilePath = path.join(__dirname, '../Data/products.json');

// Función para generar un ID aleatorio
function generateId() {
    return Math.floor(Math.random() * 10000); // ID aleatorio entre 0 y 9999
}

// Función para leer los carritos del archivo
const getCarts = () => {
    if (!fs.existsSync(cartsFilePath)) {
        // Crear el archivo si no existe
        fs.writeFileSync(cartsFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(cartsFilePath, 'utf-8');
    return JSON.parse(data);
};

// Función para guardar los carritos en el archivo
const saveCarts = (carts) => {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
};

// Crear un nuevo carrito
router.post('/', (req, res) => {
    const carts = getCarts();
    const newCart = {
        id: generateId(), // ID autogenerado
        products: []
    };

    carts.push(newCart);
    saveCarts(carts);
    res.status(201).json(newCart);
});

// Listar los productos de un carrito por ID
router.get('/:cid', (req, res) => {
    const carts = getCarts();
    const cart = carts.find(c => c.id === parseInt(req.params.cid));

    if (cart) {
        res.json(cart.products);
    } else {
        res.status(404).json({ error: 'Carrito no encontrado' });
    }
});

// Agregar un producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
    const carts = getCarts();
    const cart = carts.find(c => c.id === parseInt(req.params.cid));
    const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
    const product = products.find(p => p.id === parseInt(req.params.pid));

    if (!cart || !product) {
        return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    }

    const existingProduct = cart.products.find(p => p.product === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1; // Sumar una unidad si ya existe
    } else {
        cart.products.push({ product: product.id, quantity: 1 });
    }

    saveCarts(carts);
    res.json(cart);
});

module.exports = router;
