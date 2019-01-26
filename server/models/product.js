var mongoose = require('mongoose');
var validator = require('validator');
var Product = mongoose.model('Product', {
    supplier: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100
    },
    quoteDate: {
        type: Date,
        required: false
    },
    productName: {
        type: String,
        required: true,
        minLength: 1,
        unique: true
    },
    productSpecs: {
        type: String,
        required: false,
        maxLength: 5000
    },
    price: {
        type: Number,
        required: true
    },
    contactEmail: {
        type: String,
        required: false,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    productImage: {
        type: String
    },
    createdOn: {
        type: Number,
        default: null
    },
    _createdBy: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    modifiedOn: {
        type: Number,
        default: null
    },
    _modifiedBy: {
        type: mongoose.Schema.ObjectId,
        required: false
    }
});

module.exports = {Product};