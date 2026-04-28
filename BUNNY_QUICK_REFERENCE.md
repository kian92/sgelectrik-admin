# Bunny.net Integration - Quick Reference

## 🚀 Quick Start

### 1. Upload Image in a Component

```tsx
import { ImageUpload } from "@/components/FileUpload";

export function MyComponent() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <ImageUpload
      onUploadComplete={(url) => setImageUrl(url)}
      onUploadError={(error) => alert(error)}
    />
  );
}
```

### 2. Use Uploaded URL

```tsx
<img src={imageUrl} alt="My image" />
// or with Next.js
<Image src={imageUrl} alt="My image" width={600} height={400} />
```

## 📁 File Structure

```
app/
├── lib/
│   └── bunny.ts              ← Core Bunny utilities
├── api/
│   └── upload/
│       └── route.ts          ← Upload API endpoint
└── (common)/
    └── rental-form-client.tsx    ← Already integrated ✓

components/
└── FileUpload.tsx            ← Upload components (ImageUpload, VideoUpload)

next.config.ts               ← CDN domain configured ✓
```

## 🎯 Components Available

### ImageUpload
For image uploads with validation

```tsx
<ImageUpload
  onUploadComplete={(url, path) => console.log(url)}
  onUploadError={(error) => console.error(error)}
  label="Upload Image"
  description="PNG, JPG, WebP, or GIF"
/>
```

### VideoUpload
For video uploads

```tsx
<VideoUpload
  onUploadComplete={(url, path) => console.log(url)}
  label="Upload Video"
/>
```

### FileUpload (Generic)
For any file type with custom config

```tsx
<FileUpload
  accept="application/pdf"
  maxSize={10 * 1024 * 1024}  // 10MB
  onUploadComplete={(url, path) => console.log(url)}
/>
```

## 🔗 API Endpoint

**POST** `/api/upload`

```typescript
// Client side
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const res = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const { success, url, path, error } = await res.json();
```

## 📊 Supported Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| Images | JPG, PNG, WebP, GIF, SVG | 500MB |
| Videos | MP4, WebM, MPEG | 500MB |

## 🛠️ Utility Functions

```typescript
import {
  uploadToBunny,      // Upload file to CDN
  deleteFromBunny,    // Delete file from CDN
  validateFile,       // Validate before upload
  getCdnUrl,          // Get CDN URL from path
  extractPathFromUrl, // Get path from URL
} from "@/app/lib/bunny";
```

## 📍 Currently Integrated Pages

| Page | Feature | Status |
|------|---------|--------|
| `/admin/blog` | Blog cover images | ✅ Ready |
| `/admin/rentals` | Vehicle images | ✅ Ready |
| `/dealer/rentals` | Vehicle images | ✅ Ready |

## ⚡ Environment Variables

Already set in `.env`:

```env
BUNNY_STORAGE_ZONE=sgelectrik-media
BUNNY_STORAGE_API_KEY=****
BUNNY_STORAGE_REGION=sg
BUNNY_STORAGE_ENDPOINT=sg.storage.bunnycdn.com
BUNNY_CDN_HOST=sgelectrik-media.b-cdn.net
```

## 💡 Common Patterns

### Pattern 1: Upload with Preview

```tsx
const [preview, setPreview] = useState("");

<ImageUpload
  onUploadComplete={(url) => {
    setPreview(url);
    // Store URL in form/database
  }}
/>
{preview && <img src={preview} alt="Preview" />}
```

### Pattern 2: Upload in Form Submission

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // imageUrl already set by ImageUpload component
  const data = {
    title: form.title,
    imageUrl: imageUrl, // ← CDN URL
    // ... other fields
  };
  
  await fetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
```

### Pattern 3: Upload Multiple Files

```tsx
const [images, setImages] = useState<string[]>([]);

{images.map((url) => (
  <ImageUpload
    key={url}
    onUploadComplete={(newUrl) => {
      setImages([...images, newUrl]);
    }}
  />
))}
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Upload fails silently | Check browser console, verify API response |
| "File not supported" | Check file MIME type, compare with allowed types |
| Large files timeout | Bunny CDN has 500MB limit, no chunking support |
| Image won't load from CDN | Check next.config remotePatterns includes Bunny domain |
| CORS errors | API endpoint handles CORS, should not occur |

## 📚 Documentation

- Full guide: [BUNNY_CDN_GUIDE.md](./BUNNY_CDN_GUIDE.md)
- Bunny.net docs: https://docs.bunnycdn.com/
- Next.js images: https://nextjs.org/docs/pages/building-your-application/optimizing/images

---

**Pro Tips:**
- 🎯 Always show loading state during upload
- ✅ Show success confirmation after upload
- ⚠️ Display error messages clearly to users
- 📦 Compress images before upload for better UX
- 🔐 Never expose API key in client-side code

