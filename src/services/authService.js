import { supabase } from './supabaseClient';

/**
 * Authentication Service
 * Handles login, logout, and user role management for Admin, Teacher, and Student
 */

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} User data with role
 */
export const loginUser = async (email, password) => {
  try {
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // Get user role from metadata or database
    const userRole = data.user.user_metadata?.role || await getUserRole(data.user.id);

    // Store auth token and user info
    localStorage.setItem('authToken', data.session.access_token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userRole', userRole);

    return {
      user: data.user,
      session: data.session,
      role: userRole
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get user role from database
 * @param {string} userId - User ID (auth_id from public.users)
 * @returns {Promise<string>} User role
 */
export const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', userId)
      .single();

    if (error) {
      console.warn('Could not fetch user role:', error);
      return USER_ROLES.STUDENT; // Default to student
    }

    return data?.role || USER_ROLES.STUDENT;
  } catch (error) {
    console.error('Error getting user role:', error);
    return USER_ROLES.STUDENT;
  }
};

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} role - User role (admin, teacher, student)
 * @param {object} metadata - Additional user metadata
 * @returns {Promise} User data
 */
export const registerUser = async (email, password, role = USER_ROLES.STUDENT, metadata = {}) => {
  try {
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          ...metadata
        }
      }
    });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // Store user role in database
    await storeUserRole(data.user.id, data.user.email, role);

    return {
      user: data.user,
      role
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Store user role in database
 * @param {string} userId - User ID (auth_id)
 * @param {string} email - User email
 * @param {string} role - User role
 * @param {string} name - User name
 */
export const storeUserRole = async (userId, email, role, name = '') => {
  try {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          auth_id: userId,
          email,
          name: name || email.split('@')[0],
          role,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.warn('Could not store user role:', error);
    }
  } catch (error) {
    console.error('Error storing user role:', error);
  }
};

/**
 * Logout current user
 * @returns {Promise} Logout result
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message || 'Logout failed');
    }

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current user session
 * @returns {Promise} Current session
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message || 'Failed to get session');
    }

    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get current user
 * @returns {Promise} Current user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message || 'Failed to get user');
    }

    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Get current user role from local storage
 * @returns {string} User role
 */
export const getCurrentUserRole = () => {
  return localStorage.getItem('userRole') || USER_ROLES.STUDENT;
};

/**
 * Get current user ID from local storage
 * @returns {string} User ID
 */
export const getCurrentUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Get current user email from local storage
 * @returns {string} User email
 */
export const getCurrentUserEmail = () => {
  return localStorage.getItem('userEmail');
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise} Update result
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message || 'Password update failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise} Reset result
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(error.message || 'Password reset email failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Verify email
 * @param {string} token - Verification token
 * @returns {Promise} Verification result
 */
export const verifyEmail = async (token) => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      throw new Error(error.message || 'Email verification failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
  getCurrentUserRole,
  getCurrentUserId,
  getCurrentUserEmail,
  updatePassword,
  sendPasswordResetEmail,
  verifyEmail,
  USER_ROLES
};
