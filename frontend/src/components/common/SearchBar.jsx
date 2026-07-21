import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ placeholder = 'Tìm kiếm tour...', className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/tours?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 btn-primary whitespace-nowrap"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Search suggestions - có thể mở rộng sau */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <p className="text-sm text-gray-500 px-3 py-1">Gợi ý tìm kiếm</p>
            {/* Popular search terms */}
            <button
              onClick={() => {
                setQuery('Đà Nẵng');
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm"
            >
              Đà Nẵng
            </button>
            <button
              onClick={() => {
                setQuery('Phú Quốc');
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm"
            >
              Phú Quốc
            </button>
            <button
              onClick={() => {
                setQuery('Hà Nội');
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm"
            >
              Hà Nội
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;