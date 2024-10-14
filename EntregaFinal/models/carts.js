const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
