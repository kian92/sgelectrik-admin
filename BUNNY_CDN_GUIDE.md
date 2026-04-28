# Bunny.net CDN Integration Guide

## Overview

This project now integrates with **Bunny.net CDN** for storing and serving all images and videos. The integration provides:

- ✅ Direct file uploads to Bunny.net storage
- ✅ Optimized CDN delivery globally
- ✅ Automatic file organization (images/videos folders)
- ✅ Reusable upload components
- ✅ Type-safe API endpoints
- ✅ Environment-based configuration

## Environment Configuration

Your `.env` file already contains all required Bunny.net credentials:

```env
BUNNY_STORAGE_ZONE=sgelectrik-media
BUNNY_STORAGE_API_KEY=1b08c0a5-f0ed-4bc2-bad0b9d2fc9d-fd42-45a7
BUNNY_STORAGE_REGION=sg
BUNNY_STORAGE_ENDPOINT=sg.storage.bunnycdn.com
BUNNY_CDN_HOST=sgelectrik-media.b-cdn.net
```

### Configuration Details

| Variable | Purpose |
|----------|---------|
| `BUNNY_STORAGE_ZONE` | Your storage zone name in Bunny.net |
| `BUNNY_STORAGE_API_KEY` | API key for authentication (keep secure!) |
| `BUNNY_STORAGE_REGION` | Region code (sg for Singapore) |
| `BUNNY_STORAGE_ENDPOINT` | API endpoint for your region |
| `BUNNY_CDN_HOST` | CDN domain for serving files |

## Architecture

### Core Files

1. **`app/lib/bunny.ts`** - Bunny.net utility functions
   - `uploadToBunny()` - Upload files to storage
   - `deleteFromBunny()` - Delete files from storage
   - `validateFile()` - Validate file type and size
   - `getCdnUrl()` - Generate CDN URLs
   - `extractPathFromUrl()` - Extract path from CDN URLs

2. **`app/api/upload/route.ts`** - Upload API endpoint
   - POST endpoint for file uploads
   - Accepts FormData with file
   - Returns CDN URL on success

3. **`components/FileUpload.tsx`** - Upload UI components
   - `FileUpload` - Generic file upload component
   - `ImageUpload` - Image-specific component
   - `VideoUpload` - Video-specific component
   - Drag-and-drop support
   - Progress indication

### File Organization

Files uploaded to Bunny.net are automatically organized:

```
sgelectrik-media/
├── images/
│   ├── timestamp-random.jpg
│   ├── timestamp-random.png
│   └── ...
├── videos/
│   ├── timestamp-random.mp4
│   └── ...
└── files/
    └── timestamp-random.bin
```

## Usage Examples

### 1. Upload Images in Blog Page

The blog admin page now includes the `ImageUpload` component:

```tsx
import { ImageUpload } from "@/components/FileUpload";

<ImageUpload
  onUploadComplete={(url) => {
    setForm((f) => ({ ...f, cover_image: url }));
  }}
  onUploadError={(error) => {
    console.error("Upload failed:", error);
  }}
  label="Upload Cover Image"
  description="PNG, JPG, WebP, or GIF up to 500MB"
/>
```

**Location**: `/admin/blog` - Convert image cover backgrounds to uploaded images

### 2. Upload Vehicle Images in Rental Forms

The rental form now supports image uploads for vehicle listings:

```tsx
<ImageUpload
  onUploadComplete={(url) => {
    setFleet(index, "imageId", url);
  }}
  label="Upload Vehicle Image"
  description="Click or drag to upload"
/>
```

**Location**: `/admin/rentals`, `/dealer/rentals` - Upload vehicle images

### 3. Use Upload Component in Custom Pages

```tsx
import { ImageUpload, VideoUpload, FileUpload } from "@/components/FileUpload";

// Image upload
<ImageUpload
  onUploadComplete={(url, path) => {
    console.log("Image uploaded:", url);
  }}
  onUploadError={(error) => {
    console.error("Error:", error);
  }}
/>

// Video upload
<VideoUpload
  onUploadComplete={(url, path) => {
    console.log("Video uploaded:", url);
  }}
/>

// Generic file upload
<FileUpload
  accept="application/pdf"
  label="Upload PDF"
  onUploadComplete={(url, path) => {
    console.log("PDF uploaded:", url);
  }}
/>
```

## API Reference

### POST /api/upload

Upload a file to Bunny.net storage.

**Request:**
```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const data = await response.json();
```

**Response (Success):**
```json
{
  "success": true,
  "url": "https://sgelectrik-media.b-cdn.net/images/1732456789-abc123.jpg",
  "path": "images/1732456789-abc123.jpg"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "File size exceeds maximum of 500MB"
}
```

## Supported File Types

### Images
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)
- SVG (`.svg`)

### Videos
- MP4 (`.mp4`)
- WebM (`.webm`)
- MPEG (`.mpeg`)

### File Size Limits
- **Maximum**: 500MB per file
- **Recommended**: 
  - Images: < 10MB
  - Videos: < 100MB

## Component Props

### FileUpload Props

```typescript
interface FileUploadProps {
  onUploadComplete: (url: string, path: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;                    // Default: "image/*,video/*"
  maxSize?: number;                   // Default: 500MB
  label?: string;                     // Upload label
  description?: string;               // Instruction text
  className?: string;                 // CSS classes
  disabled?: boolean;                 // Disable uploads
}
```

### ImageUpload Props

Inherits from `FileUploadProps` but limited to images:
- Auto-accepts: PNG, JPG, WebP, GIF, SVG
- Optional: `onUrlChange(url)` callback

### VideoUpload Props

Inherits from `FileUploadProps` but limited to videos:
- Auto-accepts: MP4, WebM, MPEG

## Using Bunny Utility Functions

### Upload Files Programmatically

```typescript
import { uploadToBunny, validateFile } from "@/app/lib/bunny";

// Validate file first
const validation = validateFile(file.type, file.size);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Upload to Bunny.net
const buffer = Buffer.from(await file.arrayBuffer());
const result = await uploadToBunny(buffer, file.name, file.type);

if (result.success) {
  console.log("Uploaded to:", result.url);
} else {
  console.error("Upload failed:", result.error);
}
```

### Delete Files

```typescript
import { deleteFromBunny } from "@/app/lib/bunny";

const filePath = "images/timestamp-random.jpg";
const deleted = await deleteFromBunny(filePath);

if (deleted) {
  console.log("File deleted successfully");
}
```

### Get CDN URL

```typescript
import { getCdnUrl, extractPathFromUrl } from "@/app/lib/bunny";

// From file path
const cdnUrl = getCdnUrl("images/timestamp-random.jpg");
// Returns: "https://sgelectrik-media.b-cdn.net/images/timestamp-random.jpg"

// Extract path from URL
const path = extractPathFromUrl(cdnUrl);
// Returns: "images/timestamp-random.jpg"
```

## Image Configuration

The `next.config.ts` is configured to allow images from Bunny CDN:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "sgelectrik-media.b-cdn.net",
      pathname: "/**",
    },
  ],
}
```

You can now use `next/image` with Bunny CDN URLs:

```tsx
import Image from "next/image";

<Image
  src="https://sgelectrik-media.b-cdn.net/images/timestamp-random.jpg"
  alt="Vehicle"
  width={600}
  height={400}
/>
```

## Pages with Upload Integration

✅ **Fully Integrated:**
- `/admin/blog` - Blog cover image uploads
- `/admin/rentals` - Vehicle image uploads for rental companies
- `/dealer/rentals` - Dealer vehicle image uploads

**Ready to Integrate:**
- `/admin/dealers` - Dealer logo/image uploads
- `/admin/charging` - Charging station images
- `/admin/workshops` - Workshop images

## Best Practices

1. **Always validate files** before upload in your UI
2. **Show progress indicators** during upload
3. **Handle errors gracefully** with user feedback
4. **Use CDN URLs** in production for all images/videos
5. **Delete old files** when replacing media
6. **Optimize images** before upload (compress, resize)
7. **Keep API key secure** - never expose in client code
8. **Monitor Bunny.net metrics** for bandwidth usage

## Troubleshooting

### Upload fails with "credentials not configured"
- Verify `.env` file contains all Bunny.net variables
- Restart development server after env changes

### "File type not supported" error
- Check file extension matches accepted types
- Ensure MIME type is correct

### Images not displaying from CDN
- Verify `next.config.ts` includes Bunny patterns
- Check CDN URL format matches configuration
- Ensure file exists in Bunny storage

### Large file uploads timeout
- Maximum file size is 500MB
- For larger files, consider chunked uploads
- Or use Bunny.net web dashboard for manual upload

## Security Considerations

⚠️ **Important:**
- `BUNNY_STORAGE_API_KEY` is in `.env.local` (never commit)
- API key grants full access to your storage zone
- Only expose upload API endpoint to authenticated users
- Implement rate limiting if needed
- Validate file types server-side, not just client-side

## Monitoring & Analytics

Access Bunny.net dashboard at: https://console.bunnycdn.com

Track:
- Bandwidth usage
- Request counts
- Geographic data
- Cache performance

## Support Resources

- [Bunny.net Storage Documentation](https://docs.bunnycdn.com/storage/)
- [Bunny CDN Documentation](https://docs.bunnycdn.com/cdn/)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)

---

**Last Updated**: April 28, 2026
