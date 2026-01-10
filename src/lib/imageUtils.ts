/**
 * Convert image file to WebP format
 * @param file - Original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @returns Promise<Blob> - WebP blob
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image on canvas
            ctx?.drawImage(img, 0, 0);

            // Convert to WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert image to WebP'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Load the image
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Upload image to Supabase Storage and return public URL
 * @param file - Image file to upload
 * @param bucket - Supabase storage bucket name
 * @param path - Storage path (optional)
 * @returns Promise<string> - Public URL of uploaded image
 */
export async function uploadImageToSupabase(
    file: File,
    supabaseClient: any,
    bucket: string = 'order-images',
    path?: string
): Promise<string> {
    // Convert to WebP first
    const webpBlob = await convertToWebP(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = path || `${timestamp}-${randomStr}.webp`;

    // Upload to Supabase Storage
    const { error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, webpBlob, {
            contentType: 'image/webp',
            upsert: false
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrl;
}
