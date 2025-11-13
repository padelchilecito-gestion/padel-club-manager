import React from 'react';

const ProductCard = ({ product }) => {
  const { name, category, price, imageUrl, stock } = product;

  return (
    <div className="bg-dark-secondary rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
      <img 
        className="w-full h-48 object-cover" 
        src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} 
        alt={`Imagen de ${name}`} 
      />
      <div className="p-4">
        <p className="text-sm text-text-secondary">{category}</p>
        <h3 className="text-xl font-bold text-text-primary truncate">{name}</h3>
        <div className="flex justify-between items-center mt-4">
          <p className="text-2xl font-semibold text-primary">${price.toFixed(2)}</p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            stock > 0 ? 'bg-secondary text-dark-primary' : 'bg-danger text-white'
          }`}>
            {stock > 0 ? 'En Stock' : 'Agotado'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;