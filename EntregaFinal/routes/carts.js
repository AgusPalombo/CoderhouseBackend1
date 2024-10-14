const express = require('express');
const Cart = require('../models/Cart'); // Importar el modelo de Carts
const Product = require('../models/Product'); // Importar el modelo de Products
const router = express.Router();

// Crear un carrito
router.post('/', async (req, res) => {
    try {
        const newCart = new Cart({ products: [] });
        await newCart.save();
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el carrito' });
    }
});

// Obtener todos los productos de un carrito específico
router.get('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate('products.product');
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        res.json(cart.products);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos del carrito' });
    }
});

// Agregar un producto al carrito
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        const product = await Product.findById(req.params.pid);
        
        if (!cart || !product) {
            return res.status(404).json({ error: 'Carrito o producto no encontrado' });
        }
        
        const existingProduct = cart.products.find(p => p.product.toString() === req.params.pid);
        
        if (existingProduct) {
            existingProduct.quantity += req.body.quantity || 1;
        } else {
            cart.products.push({ product: req.params.pid, quantity: req.body.quantity || 1 });
        }
        
        await cart.save();
        res.status(201).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el producto al carrito' });
    }
});

// Eliminar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        cart.products = cart.products.filter(p => p.product.toString() !== req.params.pid);
        
        await cart.save();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto del carrito' });
    }
});

// Actualizar el carrito
router.put('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        cart.products = req.body.products.map(product => ({
            product: product.id,
            quantity: product.quantity
        }));
        
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el carrito' });
    }
});

// Actualizar solo la cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        const product = cart.products.find(p => p.product.toString() === req.params.pid);
        if (product) {
            product.quantity = req.body.quantity;
            await cart.save();
            res.json(cart);
        } else {
            res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la cantidad del producto' });
    }
});

// Eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        cart.products = [];
        await cart.save();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al limpiar el carrito' });
    }
});

// Limpiar el carrito (eliminar todos los productos)
router.delete('/:cid/clean', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        
        cart.products = [];
        await cart.save();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al limpiar el carrito' });
    }
});

module.exports = router;
