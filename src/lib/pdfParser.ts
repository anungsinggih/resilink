import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedLabel {
    orderId: string;
    trackingNumber: string;
    courier: string;
    productName: string;
    variant: string;
    fullText: string;
}

export async function parseShippingLabel(file: File): Promise<ParsedLabel> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n';
    }

    return extractData(fullText);
}

function extractData(text: string): ParsedLabel {
    // Common patterns for Shopee/Tokopedia
    // Shopee Order ID typically starts with 2x followed by many numbers
    const shopeeOrderIdMatch = text.match(/[0-9]{2}[0-9A-Z]{10,}/);
    // Tracking numbers vary by courier, but are usually alphanumeric
    const trackingMatch = text.match(/JP[0-9]{10}|SPXID[0-9]{10}|[A-Z]{3,}[0-9]{10}/);

    // Basic heuristics for product names (this is the hardest part without strict schema)
    // Often after "Nama Produk" or "Items" or in a certain position
    const productInfo = findProductInfo(text);

    return {
        orderId: shopeeOrderIdMatch ? shopeeOrderIdMatch[0] : 'Unknown',
        trackingNumber: trackingMatch ? trackingMatch[0] : 'Unknown',
        courier: detectCourier(text),
        productName: productInfo.name,
        variant: productInfo.variant,
        fullText: text
    };
}

function detectCourier(text: string): string {
    const couriers = ['J&T', 'SiCepat', 'Shopee Xpress', 'JNE', 'Anteraja', 'GoSend', 'GrabExpress'];
    for (const courier of couriers) {
        if (text.toLowerCase().includes(courier.toLowerCase())) return courier;
    }
    return 'Unknown Courier';
}

function findProductInfo(text: string): { name: string, variant: string } {
    // Simple heuristic: look for common product names or table headers
    // For Shopee labels, product names often follow a specific pattern in the middle of the text


    // Look for SKU-like patterns or keywords
    let name = 'Unknown Product';
    let variant = '';

    // This is a very basic implementation. In reality, you'd want to handle multiple formats.
    if (text.includes('Nama Produk')) {
        const parts = text.split('Nama Produk');
        if (parts[1]) {
            name = parts[1].split('   ')[0].trim();
        }
    }

    return { name, variant };
}
