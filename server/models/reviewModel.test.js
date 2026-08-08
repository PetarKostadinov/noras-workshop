import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Review from './reviewModel.js';

const validReview = () => ({
    product: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    username: 'Customer',
    rating: 5,
    comment: 'A thoughtful and detailed product review.',
});

test('review schema accepts a valid customer review', () => {
    assert.equal(new Review(validReview()).validateSync(), undefined);
});

test('review schema rejects manipulated ratings and short comments', () => {
    const error = new Review({ ...validReview(), rating: 8, comment: 'Short' }).validateSync();
    assert.ok(error.errors.rating);
    assert.ok(error.errors.comment);
});

test('reviewer account identifiers are excluded from normal queries', () => {
    assert.equal(Review.schema.path('user').options.select, false);
});
