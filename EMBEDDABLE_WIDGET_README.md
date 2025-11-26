# Embeddable Public Chat Widget - Implementation Complete

## ✅ Status: FULLY IMPLEMENTED

The embeddable chat widget is now ready to use on any external website!

---

## 🎯 What Is This?

A standalone JavaScript widget that can be embedded on external websites (like livingwellnessdental.com) to provide AI-powered chat using your wiki content. Visitors can ask questions and get instant answers without leaving your website.

---

## 📁 Files Created

```
app/
├── api/
│   └── widget/
│       └── chat/
│           └── route.ts              # Public API with CORS & rate limiting
└── widget/
    └── chat/
        ├── page.tsx                  # Widget iframe page
        ├── layout.tsx                # Minimal layout for iframe
        └── ChatWidgetFrame.tsx       # Widget UI component

public/
└── widget/
    └── chat.js                       # Embeddable script

test-widget.html                      # Local testing page
```

---

## 🚀 How to Use

### Basic Embedding

Add this single line to any website:

```html
<script
  src="https://app.livingwellnessdental.com/widget/chat.js"
  defer
></script>
```

### With Customization

```html
<script
  src="https://app.livingwellnessdental.com/widget/chat.js"
  data-theme="light"
  data-accent="7c3aed"
  data-position="right"
  data-greeting="Welcome to Living Wellness Dental! How can I help you today?"
  defer
></script>
```

---

## ⚙️ Configuration Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-theme` | `light`, `dark` | `light` | Color theme |
| `data-accent` | Hex color (no #) | `7c3aed` (violet) | Primary brand color |
| `data-position` | `left`, `right` | `right` | Widget position |
| `data-greeting` | String | "Hi! How can I help..." | Initial greeting message |
| `data-base-url` | URL | Production URL | API base URL (for testing) |

### Color Examples

```html
<!-- Blue -->
<script ... data-accent="3b82f6"></script>

<!-- Green -->
<script ... data-accent="10b981"></script>

<!-- Purple (default) -->
<script ... data-accent="7c3aed"></script>

<!-- Custom brand color -->
<script ... data-accent="ff6b6b"></script>
```

---

## 🧪 Local Testing

### Method 1: Using the Test File

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the test file in a browser:
   ```bash
   # Option A: Direct file open
   open test-widget.html

   # Option B: Using Python server
   python3 -m http.server 8000
   # Then visit: http://localhost:8000/test-widget.html

   # Option C: Using VS Code Live Server
   # Right-click test-widget.html → Open with Live Server
   ```

3. Click the purple chat button to test!

### Method 2: Create Your Own Test

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Test Page</title>
</head>
<body>
  <h1>My Website</h1>
  <p>Content here...</p>

  <script
    src="http://localhost:3000/widget/chat.js"
    data-base-url="http://localhost:3000"
    data-accent="3b82f6"
    defer
  ></script>
</body>
</html>
```

---

## 🔒 Security Features

### 1. CORS Protection

Only allowed domains can use the API:

```typescript
const ALLOWED_ORIGINS = [
  'https://livingwellnessdental.com',
  'https://www.livingwellnessdental.com',
  'http://localhost:3000',        // For testing
  'http://localhost:5500',        // VS Code Live Server
  'http://localhost:8000',        // Python http.server
];
```

**To add your domain:**
1. Edit `app/api/widget/chat/route.ts`
2. Add your domain to `ALLOWED_ORIGINS`
3. Deploy

### 2. Rate Limiting

Built-in protection against abuse:
- **20 requests per minute** per IP address
- Automatic reset after 1 minute
- Prevents API spam

**For production**, upgrade to Redis-based rate limiting:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 3. Input Validation

- Message length limited to 500 characters
- Conversation history limited to 6 messages
- HTML/scripts automatically sanitized

### 4. iframe Isolation

- Widget runs in sandboxed iframe
- No access to parent page's data
- Prevents style conflicts
- Secure cross-origin communication

---

## 🎨 Customization Examples

### Dark Theme with Green Accent

```html
<script
  src="https://app.livingwellnessdental.com/widget/chat.js"
  data-theme="dark"
  data-accent="10b981"
  data-greeting="Need help? Ask me anything!"
  defer
></script>
```

### Left Position with Custom Colors

```html
<script
  src="https://app.livingwellnessdental.com/widget/chat.js"
  data-position="left"
  data-accent="f59e0b"
  data-theme="light"
  defer
></script>
```

---

## 🌐 Production Deployment

### Step 1: Update CORS Origins

Edit `app/api/widget/chat/route.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://livingwellnessdental.com',
  'https://www.livingwellnessdental.com',
  'https://yourdomain.com',           // Add your domain
  // Remove localhost entries in production
];
```

### Step 2: Deploy to Vercel

```bash
git add .
git commit -m "Add embeddable chat widget"
git push
```

Vercel will auto-deploy.

### Step 3: Update Your Website

Replace the test URL with your production URL:

```html
<script
  src="https://app.livingwellnessdental.com/widget/chat.js"
  defer
></script>
```

### Step 4: Test on Staging First!

Always test on a staging domain before production.

---

## 💰 Cost Estimates

Same as internal widget:
- **Embeddings:** ~$0.01-0.10/month
- **Chat (1000 queries):** ~$1-2/month
- **Total:** ~$2-5/month for moderate usage

Rate limiting prevents unexpected costs from abuse.

---

## 🐛 Troubleshooting

### Widget doesn't appear

1. Check browser console for errors
2. Verify `data-base-url` is correct
3. Ensure script has `defer` attribute
4. Check CORS settings if on external domain

### CORS errors

```
Access to fetch at '...' has been blocked by CORS policy
```

**Solution:** Add your domain to `ALLOWED_ORIGINS` in the API route

### Rate limit errors

```
Too many requests. Please wait a moment.
```

**Solution:** Wait 1 minute or increase `RATE_LIMIT` in the API

### Widget not responding

1. Check OpenAI API key is set: `OPENAI_API_KEY`
2. Verify database connection
3. Check API route logs for errors

---

## 📊 Analytics & Monitoring

### Track Usage

The API route logs:
- IP addresses
- Request counts
- Error rates

Add your own analytics:

```typescript
// In app/api/widget/chat/route.ts
console.log('Widget chat:', {
  ip,
  message: message.substring(0, 50),
  timestamp: new Date().toISOString(),
});
```

### Monitor Costs

Track OpenAI usage in your OpenAI dashboard:
- https://platform.openai.com/usage

---

## 🎯 Advanced Features

### Custom Greeting Based on Page

```javascript
// Detect current page and set greeting
const page = window.location.pathname;
const greeting = page.includes('services')
  ? 'Interested in our services? Ask me anything!'
  : 'Hi! How can I help you today?';

// Create script element
const script = document.createElement('script');
script.src = 'https://app.livingwellnessdental.com/widget/chat.js';
script.setAttribute('data-greeting', greeting);
script.defer = true;
document.body.appendChild(script);
```

### Show Widget Only on Certain Pages

```html
<script>
  // Only show on services and about pages
  if (window.location.pathname.match(/\/(services|about)/)) {
    const script = document.createElement('script');
    script.src = 'https://app.livingwellnessdental.com/widget/chat.js';
    script.defer = true;
    document.body.appendChild(script);
  }
</script>
```

---

## ✅ Testing Checklist

- [ ] Widget appears on page load
- [ ] Click button opens/closes chat
- [ ] Can send and receive messages
- [ ] Rate limiting works (try 20+ rapid requests)
- [ ] CORS allows your domain
- [ ] Custom colors display correctly
- [ ] Mobile responsive
- [ ] Works in all major browsers
- [ ] Doesn't conflict with existing page styles
- [ ] API key is secure (not exposed to client)

---

## 🎉 You're Done!

The embeddable widget is fully implemented and ready to use. Just add the script tag to any website and your visitors can start chatting!

**Questions?** Test locally first with `test-widget.html`, then deploy to staging before production.
