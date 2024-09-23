const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars'); //Import de Handlebars
const productsRouter = require('./routes/products');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configurar Handlebars como motor de plantillas
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rutas
app.use('/api/products', productsRouter.router);


// Renderizar vistas
app.get('/', (req, res) => {
    res.redirect('/realtimeproducts'); 
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts');
});

// Configuración de socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Emitir la lista de productos al conectarse
    socket.emit('productos', productsRouter.getProducts());

    socket.on('nuevoProducto', (producto) => {
        const existingProducts = productsRouter.getProducts();
        const productExists = existingProducts.some(p => p.id === producto.id);

        if (productExists) {
            socket.emit('error', { message: 'El ID ya existe. Por favor, ingresa un ID único.' });
        } else {
            productsRouter.agregarProducto(producto);
            io.emit('productos', productsRouter.getProducts());
        }
    });

    socket.on('eliminarProducto', (productId) => {
        productsRouter.eliminarProducto(productId);
        io.emit('productos', productsRouter.getProducts());
    });
});

// Iniciar el servidor
const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
