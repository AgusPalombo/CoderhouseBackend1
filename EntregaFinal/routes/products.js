const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/tienda', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Definir el esquema de producto
const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    stock: Number,
    category: String,
    thumbnails: [String]
});

// Crear el modelo de productos
const Product = mongoose.model('Product', productSchema);

// Obtener todos los productos con paginación, orden y filtros
router.get('/', async (req, res) => {
    const { limit = 10, page = 1, sort, query } = req.query;

    try {
        // Filtros: Buscar por categoría o stock
        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { category: query },  // Filtro por categoría
                    { stock: query }      // Filtro por disponibilidad (stock)
                ]
            };
        }

        // Ordenamiento por precio (ascendente o descendente)
        let sortOption = {};
        if (sort === 'asc') {
            sortOption = { price: 1 };
        } else if (sort === 'desc') {
            sortOption = { price: -1 };
        }

        // Obtener productos con paginación
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Contar el total de productos para calcular el total de páginas
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const result = {
            status: 'success',
            payload: products,
            totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? parseInt(page) + 1 : null,
            page: parseInt(page),
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevLink: page > 1 ? `/products?page=${page - 1}&limit=${limit}&sort=${sort}&query=${query}` : null,
            nextLink: page < totalPages ? `/products?page=${parseInt(page) + 1}&limit=${limit}&sort=${sort}&query=${query}` : null,
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
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
    const { id, ...rest } = req.body; // No permitir cambiar el ID

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
