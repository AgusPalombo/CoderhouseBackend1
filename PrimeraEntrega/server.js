const express = require('express');
const app = express();
const productsRouter = require('./Routes/products');
const cartsRouter = require('./Routes/carts');

app.use(express.json());

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Puerto al que escucha
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
