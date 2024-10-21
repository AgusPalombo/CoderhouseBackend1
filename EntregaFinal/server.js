const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars'); 
const mongoose = require('mongoose');
const productsRouter = require('./routes/products'); 
const cartsRouter = require('./routes/carts');
const Product = require('./models/products'); 

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Conexión a MongoDB usando Mongoose
mongoose.connect('mongodb://localhost:27017/tienda', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Conectado a MongoDB');

        // Agregar productos de prueba si la colección está vacía
        const count = await Product.countDocuments();
        if (count === 0) {
            const productosPrueba = [
                {
                    title: 'Producto 1',
                    price: 100,
                    description: 'Descripción del Producto 1',
                    category: 'Categoría 1', 
                    stock: 10, 
                },
                {
                    title: 'Producto 2',
                    price: 200,
                    description: 'Descripción del Producto 2',
                    category: 'Categoría 2', 
                    stock: 5, 
                }
            ];

            await Product.insertMany(productosPrueba);
            console.log('Productos de prueba agregados a la base de datos');
        }
    })
    .catch(err => console.error('Error al conectar a MongoDB', err));

// Configurar Handlebars como motor de plantillas
app.engine('handlebars', engine({
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rutas
app.use('/api/products', productsRouter); 
app.use('/api/carts', cartsRouter); 

// Renderizar vistas
app.get('/', (req, res) => {
    res.redirect('/realtimeproducts'); 
});

app.get('/realtimeproducts', async (req, res) => {
    try {
        const products = await Product.find();
        console.log('Productos obtenidos de MongoDB:', products);

        // Aquí asegúrate de definir un cartId o eliminarlo si no lo necesitas
        const cartId = 'someCartId'; 
        res.render('realTimeProducts', { productos: products, cartId: cartId });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
});


// Configuración de socket.io
io.on('connection', async (socket) => {
    console.log('Cliente conectado');

    try {
        // Emitir la lista de productos desde MongoDB al conectarse
        const productos = await Product.find(); 
        socket.emit('productos', productos);

        socket.on('nuevoProducto', async (producto) => {
            try {
                const productExists = await Product.findOne({ title: producto.title });

                if (productExists) {
                    socket.emit('error', { message: 'El producto ya existe. Por favor, ingresa un producto único.' });
                } else {
                    const newProduct = new Product(producto); 
                    await newProduct.save();
                    const updatedProducts = await Product.find(); 
                    io.emit('productos', updatedProducts); 
                }
            } catch (err) {
                console.error('Error al agregar producto:', err);
                socket.emit('error', { message: 'Error al agregar producto.' });
            }
        });

        socket.on('eliminarProducto', async (productId) => {
            try {
                await Product.findByIdAndDelete(productId);
                const updatedProducts = await Product.find();
                io.emit('productos', updatedProducts);
            } catch (err) {
                console.error('Error al eliminar producto:', err);
                socket.emit('error', { message: 'Error al eliminar producto.' });
            }
        });

    } catch (err) {
        console.error('Error en la conexión del cliente:', err);
        socket.emit('error', { message: 'Error en la conexión con el servidor.' });
    }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// Iniciar el servidor
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
