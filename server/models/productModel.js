import mongoose, { Schema } from "mongoose";

const IMAGE_PATH_PATTERN = /^(https?:\/\/.+|\/(?:images|uploads)\/.+)/i;
const productSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        image: {
            type: String, validate: {
                validator: (value) => IMAGE_PATH_PATTERN.test(value),
                message: 'Invalid Image URL'
            }
        },
        brand: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        countMany: { type: Number, required: true, min: 0, validate: Number.isInteger },
        rating: { type: Number, required: true, min: 0, max: 5 },
        numReviews: { type: Number, required: true, min: 0, validate: Number.isInteger },
        commentList: [
            new Schema({
                 userId:  String,
                 username: String,
                 comment: String
             })
         ],
    },
    {
        timestamps: true
    }
);

productSchema.index({ name: 1 }, {
    collation: {
        locale: 'en',
        strength: 2
    }
})

const Product = mongoose.model('Product', productSchema);

export default Product;
