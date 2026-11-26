const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm({ email, password }) {
  const errors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}

export function validateRegisterForm({ name, email, password, phone, address }) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();

  if (!trimmedName) {
    errors.name = "Please enter your full name.";
  } else if (trimmedName.length < 2 || trimmedName.length > 100) {
    errors.name = "Name must be between 2 and 100 characters.";
  }

  if (!trimmedEmail) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Please create a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!trimmedPhone) {
    errors.phone = "Please enter your phone number.";
  } else if (trimmedPhone.length < 7 || trimmedPhone.length > 30) {
    errors.phone = "Phone number must be between 7 and 30 characters.";
  }

  if (trimmedAddress && (trimmedAddress.length < 5 || trimmedAddress.length > 500)) {
    errors.address = "Address must be between 5 and 500 characters if provided.";
  }

  return errors;
}

export function mapServerFieldErrors(details) {
  if (!Array.isArray(details)) return {};
  const mapped = {};
  for (const item of details) {
    if (item?.field && item?.issue && !mapped[item.field]) {
      mapped[item.field] = item.issue;
    }
  }
  return mapped;
}
