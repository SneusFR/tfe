# Backend Logout Route Implementation

Add a new route to handle user logout on the backend. This route should clear the authentication token cookie.

## Route Specification

- **Path**: `/api/auth/logout`
- **Method**: POST
- **Description**: Clears the authentication token cookie and logs the user out

## Implementation Example

```javascript
// In your auth routes file (e.g., authRoutes.js)

// Logout route
router.post('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Send success response
  return res.status(200).json({ message: 'Logged out successfully' });
});
```

## Notes

- Make sure the cookie name ('token' in the example) matches the name used in your authentication system
- The cookie clearing options (httpOnly, secure, sameSite) should match the options used when setting the cookie
- This route should be accessible without authentication to allow users to log out even if their token is invalid
