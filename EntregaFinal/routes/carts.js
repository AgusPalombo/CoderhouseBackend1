const express = require('express');
const Cart = require('../models/carts'); 
const Product = require('../models/products'); 
const router = express.Router();

// Obtener todos los carritos
router.get('/', async (req, res) => {
    try {
        // Obtener todos los carritos
        const carts = await Cart.find();
        res.status(200).json(carts); 
    } catch (error) {
        console.error('Error al obtener carritos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

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


// Eliminar un carrito por ID
router.delete('/:cid', async (req, res) => {
    try {
        const cart = await Cart.findByIdAndDelete(req.params.cid);

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        res.status(204).send(); 
    } catch (error) {
        console.error('Error al eliminar el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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
router.post('/:cid', async (req, res) => {
    try {
        // Verificar que el carrito exista
        const cart = await Cart.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        // Desestructurar el productId y quantity del cuerpo de la solicitud
        const { productId, quantity } = req.body;

        // Verificar que se haya proporcionado un productId y que la cantidad sea válida
        if (!productId || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ error: 'ID del producto y cantidad válidos son requeridos' });
        }

        // Verificar si el producto existe en la colección de productos
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Comprobar si el producto ya está en el carrito
        const productInCart = cart.products.find(p => p.product.toString() === productId);
        if (productInCart) {
            // Incrementar la cantidad si ya está en el carrito
            productInCart.quantity += quantity;
        } else {
            // Agregar el producto al carrito
            cart.products.push({ product: productId, quantity });
        }

        // Guardar los cambios en el carrito
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});



// Eliminar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        // Verificar si hay productos en el carrito
        if (!cart.products || !Array.isArray(cart.products)) {
            return res.status(404).json({ error: 'No hay productos en el carrito' });
        }

        // Filtrar productos, asegurándose de que p.product esté definido
        const originalLength = cart.products.length;
        cart.products = cart.products.filter(p => p.product && p.product.toString() !== req.params.pid);

        // Comprobar si se eliminó algún producto
        if (cart.products.length === originalLength) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        await cart.save();
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar el producto del carrito:', error); // Log del error
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

// Actualizar la cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { quantity } = req.body;

        // Validar que se haya enviado una cantidad válida
        if (typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ error: 'La cantidad debe ser un número mayor que 0' });
        }

        // Buscar el carrito y popular los productos
        const cart = await Cart.findById(req.params.cid).populate('products.product'); 
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        // Log para verificar el carrito y los productos
        console.log("Carrito encontrado:", cart);
        console.log("Productos en el carrito:", cart.products);

        // Buscar el producto en el carrito
        const productInCart = cart.products.find(p => p.product && p.product._id.toString() === req.params.pid);
        if (!productInCart) {
            console.log('Producto no encontrado en el carrito');
            return res.status(404).json({ error: 'Producto no encontrado en el carrito o no está correctamente referenciado' });
        }

        // Actualizar la cantidad del producto
        productInCart.quantity = quantity;
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al actualizar la cantidad del producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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
