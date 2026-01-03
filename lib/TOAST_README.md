# React Hot Toast Implementation Guide

This project uses `react-hot-toast` with custom reusable toast components positioned at the bottom-right of the page.

## Available Toast Function

There is one unified toast function available in `/lib/toast.tsx`:

- `showToast({ title, body, type })` - Displays a toast with customizable type

### Toast Types:
- `success` - Green with checkmark icon for success messages
- `error` - Red with X icon for error messages
- `warning` - Yellow with warning triangle icon for warning messages
- `info` - Blue with info icon for informational messages (default)

## Features

- Beautiful gradient accent bars
- Lucide React icons
- Smooth slide-in/out animations
- Progress bar showing time remaining
- Backdrop blur effect
- Auto-dismiss after 4 seconds
- Manual dismiss with X button

## Usage Examples

### Import the toast function

```tsx
import { showToast } from '@/lib/toast';
```

### Basic Usage with Title Only

```tsx
showToast({
  title: 'Profile Updated!',
  type: 'success'
});

showToast({
  title: 'Something went wrong',
  type: 'error'
});
```

### Usage with Title and Body

```tsx
showToast({
  title: 'Registration Successful!',
  body: 'Please check your email to verify your account.',
  type: 'success'
});

showToast({
  title: 'Login Failed',
  body: 'Invalid email or password. Please try again.',
  type: 'error'
});

showToast({
  title: 'Session Expiring Soon',
  body: 'Your session will expire in 5 minutes.',
  type: 'warning'
});

showToast({
  title: 'New Feature Available',
  body: 'Check out our new dashboard analytics!',
  type: 'info'
});
```

### In Form Submission

```tsx
const onSubmit = async (data: FormData) => {
  try {
    setIsSubmitting(true);

    await api.submitForm(data);

    showToast({
      title: 'Form Submitted!',
      body: 'Your data has been saved successfully.',
      type: 'success'
    });

  } catch (error: any) {
    showToast({
      title: 'Submission Failed',
      body: error.message || 'Please try again later.',
      type: 'error'
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Replace Existing Error/Success States

Instead of using state-based error and success messages, you can replace them with toasts:

**Before:**
```tsx
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);

// ... in JSX
{error && <div className="error-message">{error}</div>}
{success && <div className="success-message">Success!</div>}
```

**After:**
```tsx
// No need for error/success state!

// In your try/catch:
try {
  await someAction();
  showToast({
    title: 'Action completed!',
    type: 'success'
  });
} catch (err) {
  showToast({
    title: 'Action failed',
    body: err.message,
    type: 'error'
  });
}
```

## Configuration

The toast provider is configured in `/app/layout.tsx`:

```tsx
<Toaster
  position="bottom-right"
  toastOptions={{
    duration: 4000, // 4 seconds
  }}
/>
```

## Customization

### Toast Duration
To change the default duration, modify the `toastOptions.duration` in `layout.tsx`.

### Custom Styling
Modify the toast components in `/lib/toast.tsx` to match your design system. The current implementation uses:
- Tailwind CSS classes
- Gradient accent bars (green/red/yellow/blue)
- Lucide React icons
- Smooth slide-in animations from the right
- Progress bar animation
- Backdrop blur effect
- Dismiss button with ✕

## Best Practices

1. **Use appropriate toast types**:
   - Success: Actions completed successfully
   - Error: Failed operations or validation errors
   - Warning: Non-critical issues or important notices
   - Info: General information or updates

2. **Keep titles concise**: 3-5 words maximum
3. **Use body text for details**: Additional context or instructions
4. **Don't overuse**: Only show toasts for important user feedback
5. **Replace inline errors**: For better UX, use toasts instead of inline error messages where appropriate
