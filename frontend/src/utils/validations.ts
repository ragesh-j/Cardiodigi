export const validateRegister = (form: {
  name: string
  email: string
  password: string
  phone: string
}) => {
  const errors: Record<string, string> = {}

  // name
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (form.name.trim().length > 50) {
    errors.name = 'Name must be less than 50 characters'
  }

  // email
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
  }

  // password
  if (!form.password) {
    errors.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else if (!/(?=.*[a-z])/.test(form.password)) {
    errors.password = 'Password must contain at least one lowercase letter'
  } else if (!/(?=.*[A-Z])/.test(form.password)) {
    errors.password = 'Password must contain at least one uppercase letter'
  } else if (!/(?=.*\d)/.test(form.password)) {
    errors.password = 'Password must contain at least one number'
  }

  // phone
  if (!form.phone.trim()) {
    errors.phone = 'Phone is required'
  } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
    errors.phone = 'Please enter a valid Indian mobile number'
  }

  return errors
}

export const validateLogin = (form: {
  email: string
  password: string
}) => {
  const errors: Record<string, string> = {}

  // email
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
  }

  // password
  if (!form.password) {
    errors.password = 'Password is required'
  }

  return errors
}

export const validateDoctor = (form: {
  name: string
  email: string
  specialization: string
  qualification: string
  experience: string
  phone: string
  consultationFee: string
  slotDuration: string
}) => {
  const errors: Record<string, string> = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
  }

  if (!form.specialization) {
    errors.specialization = 'Specialization is required'
  }

  if (!form.qualification.trim()) {
    errors.qualification = 'Qualification is required'
  }

  if (!form.experience) {
    errors.experience = 'Experience is required'
  } else if (Number(form.experience) < 0) {
    errors.experience = 'Experience cannot be negative'
  } else if (Number(form.experience) > 60) {
    errors.experience = 'Please enter a valid experience'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone is required'
  } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
    errors.phone = 'Please enter a valid Indian mobile number'
  }

  if (!form.consultationFee) {
    errors.consultationFee = 'Consultation fee is required'
  } else if (Number(form.consultationFee) < 0) {
    errors.consultationFee = 'Fee cannot be negative'
  }

  if (!form.slotDuration) {
    errors.slotDuration = 'Slot duration is required'
  }

  return errors
}