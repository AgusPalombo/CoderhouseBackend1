const express = require('express');
const router = express.Router();
const Product = require('../models/products'); 

// Obtener productos con filtros, paginación y ordenamiento
router.get('/', async (req, res) => {
    try {
        const { category, available, sort, limit = 10, page = 1, query, minPrice, maxPrice } = req.query;

        // Construir el filtro
        const filter = {};

        // Filtrar por categoría si se proporciona
        if (category) {
            filter.category = category;
        }

        // Filtrar por disponibilidad si se proporciona
        if (available) {
            filter.stock = { $gt: 0 }; // Solo productos disponibles
        }

        // Filtrar por título si se proporciona
        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }

        // Filtrar por precio mínimo si se proporciona
        if (minPrice) {
            filter.price = { $gte: parseFloat(minPrice) };
        }

        // Filtrar por precio máximo si se proporciona
        if (maxPrice) {
            filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
        }

        // Configuración del ordenamiento
        const sortOptions = {};
        if (sort === 'asc') {
            sortOptions.price = 1; // Orden ascendente
        } else if (sort === 'desc') {
            sortOptions.price = -1; // Orden descendente
        }

        // Calcular el número de productos a omitir
        const skip = (page - 1) * limit;

        // Obtener los productos con filtros, ordenamiento y paginación
        const productos = await Product.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit)); // Limitar la cantidad de resultados

        // Contar el total de productos para la paginación
        const total = await Product.countDocuments(filter);

        res.status(200).json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            productos,
        });
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// Obtener un producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

// Crear un nuevo producto
router.post('/', async (req, res) => {
    const { title, description, price, stock, category, thumbnails = [] } = req.body;

    // Validar que todos los campos requeridos están presentes
    if (!title || !description || !price || !stock || !category) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el producto ya existe por título
        const existingProduct = await Product.findOne({ title });

        if (existingProduct) {
            // Si el producto ya existe, aumentar el stock
            existingProduct.stock += 1;
            await existingProduct.save();
            return res.status(200).json(existingProduct); // Devolver el producto actualizado
        }

        // Crear un nuevo producto
        const newProduct = new Product({ title, description, price, stock, category, thumbnails });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

// Actualizar un producto por ID
router.put('/:pid', async (req, res) => {
    const { id, ...rest } = req.body;

    try {
        const product = await Product.findByIdAndUpdate(req.params.pid, rest, { new: true });

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// Eliminar un producto por ID
router.delete('/:pid', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.pid);

        if (product) {
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Exportar el router
module.exports = router;
