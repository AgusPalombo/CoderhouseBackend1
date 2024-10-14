const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars'); 
const mongoose = require('mongoose');
const productsRouter = require('./routes/products'); 

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Conexión a MongoDB usando Mongoose
mongoose.connect('mongodb://localhost:27017/tienda', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB', err));

// Configurar Handlebars como motor de plantillas
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rutas
app.use('/api/products', productsRouter);

// Renderizar vistas
app.get('/', (req, res) => {
    res.redirect('/realtimeproducts'); 
});

app.get('/realtimeproducts', async (req, res) => {
    try {
        // Obtener todos los productos desde MongoDB
        const productos = await productsRouter.getProducts(); 
        res.render('realTimeProducts', { productos }); // Enviamos los productos al front
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
        const productos = await productsRouter.getProducts();
        socket.emit('productos', productos);

        socket.on('nuevoProducto', async (producto) => {
            try {
                const existingProducts = await productsRouter.getProducts();
                const productExists = existingProducts.some(p => p._id.toString() === producto.id);

                if (productExists) {
                    socket.emit('error', { message: 'El ID ya existe. Por favor, ingresa un ID único.' });
                } else {
                    await productsRouter.agregarProducto(producto);
                    const updatedProducts = await productsRouter.getProducts();
                    io.emit('productos', updatedProducts); // Productos actualizados
                }
            } catch (err) {
                console.error('Error al agregar producto:', err);
                socket.emit('error', { message: 'Error al agregar producto.' });
            }
        });

        socket.on('eliminarProducto', async (productId) => {
            try {
                await productsRouter.eliminarProducto(productId);
                const updatedProducts = await productsRouter.getProducts();
                io.emit('productos', updatedProducts); //Productos actualizados
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

// Iniciar el servidor
const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
