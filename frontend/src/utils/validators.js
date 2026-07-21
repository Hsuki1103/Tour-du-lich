export const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Email không hợp lệ';
  },
  phone: (value) => {
    const regex = /^[0-9]{10,11}$/;
    return regex.test(value) ? null : 'Số điện thoại không hợp lệ';
  },
  password: (value) => {
    if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return null;
  },
  required: (value, fieldName = 'Trường này') => {
    return value && value.trim() ? null : `${fieldName} không được để trống`;
  },
  min: (value, min, fieldName = 'Trường này') => {
    return parseFloat(value) >= min ? null : `${fieldName} phải lớn hơn hoặc bằng ${min}`;
  },
  max: (value, max, fieldName = 'Trường này') => {
    return parseFloat(value) <= max ? null : `${fieldName} phải nhỏ hơn hoặc bằng ${max}`;
  },
  minLength: (value, length, fieldName = 'Trường này') => {
    return value.length >= length ? null : `${fieldName} phải có ít nhất ${length} ký tự`;
  },
  maxLength: (value, length, fieldName = 'Trường này') => {
    return value.length <= length ? null : `${fieldName} tối đa ${length} ký tự`;
  },
};

export const validateForm = (values, rules) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
};