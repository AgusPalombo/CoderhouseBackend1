require('dotenv').config();
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

// // Conexión a MongoDB
// mongoose.connect('mongodb://localhost:27017/tienda', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
// .then(() => {
//     console.log('Conectado a MongoDB');
//     precargarProductos(); // Llama a la función de precarga
// })
// .catch(err => console.error('Error de conexión a MongoDB:', err));



mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Conectado a MongoDB Atlas');
    precargarProductos(); // Llama a la función de precarga
})
.catch(err => console.error('Error de conexión a MongoDB:', err));


// Función para precargar productos
async function precargarProductos() {
    const productos = [
        {
            title: "Camiseta Deportiva",
            description: "Camiseta ligera para entrenamiento.",
            price: 19.99,
            stock: 100,
            category: "Ropa",
            thumbnails: ["url1.jpg", "url2.jpg"]
        },
        {
            title: "Zapatillas de Correr",
            description: "Zapatillas cómodas para correr.",
            price: 59.99,
            stock: 50,
            category: "Calzado",
            thumbnails: ["url3.jpg", "url4.jpg"]
        },
        {
            title: "Mochila de Aventura",
            description: "Mochila resistente para excursiones.",
            price: 39.99,
            stock: 30,
            category: "Accesorios",
            thumbnails: ["url5.jpg", "url6.jpg"]
        },
        {
            title: "Gafas de Sol",
            description: "Gafas de sol con protección UV.",
            price: 29.99,
            stock: 70,
            category: "Accesorios",
            thumbnails: ["url7.jpg", "url8.jpg"]
        },
        {
            title: "Reloj Deportivo",
            description: "Reloj con cronómetro y resistencia al agua.",
            price: 79.99,
            stock: 20,
            category: "Relojes",
            thumbnails: ["url9.jpg", "url10.jpg"]
        }
    ];

    try {
        // Elimina todos los productos existentes para evitar duplicados
        await Product.deleteMany({});

        // Inserta los nuevos productos
        await Product.insertMany(productos);
        console.log('Productos precargados en la base de datos');
    } catch (error) {
        console.error('Error al precargar productos:', error);
    }
}

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
