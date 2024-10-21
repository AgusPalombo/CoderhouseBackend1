const express = require('express');
const router = express.Router();
const Product = require('../models/products'); 

// Obtener todos los productos con paginación y filtrado
router.get('/', async (req, res) => {
    try {
        // Obtención de parámetros de consulta
        const { limit = 10, page = 1, sort, query } = req.query;

        // Convertir limit y page a números
        const limitNumber = parseInt(limit);
        const pageNumber = parseInt(page);

        // Inicializar condiciones de búsqueda
        const filter = query ? { title: new RegExp(query, 'i') } : {}; // Búsqueda por título (case insensitive)

        // Inicializar opciones de ordenamiento
        let sortOptions = {};
        if (sort) {
            sortOptions.price = sort === 'asc' ? 1 : -1; // Ascendente o descendente
        }

        // Consulta a la base de datos con paginación, filtrado y ordenamiento
        const products = await Product.find(filter)
            .sort(sortOptions)
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .exec();

        // Obtener el total de productos para calcular la cantidad de páginas
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        // Respuesta con productos y datos de paginación
        res.json({
            status: 'success',
            totalProducts,
            totalPages,
            currentPage: pageNumber,
            products
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
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
