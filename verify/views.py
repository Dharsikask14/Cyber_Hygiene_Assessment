import hashlib
import qrcode
import io
import base64
from django.http import JsonResponse, HttpResponse
from .models import Certificate

def generate_certificate(request):
    name = request.GET.get('name')
    cert_id = request.GET.get('id')
    
    if not name or not cert_id:
        return JsonResponse({'error': 'Name and ID required'}, status=400)
    
    security_string = f"{name}|{cert_id}"
    secure_hash = hashlib.sha256(security_string.encode()).hexdigest()
    
    cert, created = Certificate.objects.get_or_create(
        certificate_id=cert_id,
        defaults={'recipient_name': name, 'secure_hash': secure_hash}
    )
    
    # Generate QR Code as base64 string
    verify_url = f"http://127.0.0.1:8000/verify/{cert_id}/"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return JsonResponse({
        'status': 'success',
        'id': cert_id,
        'hash': secure_hash,
        'verify_url': verify_url,
        'qr_code': qr_base64
    })

def verify_certificate(request, cert_id):
    name_to_check = request.GET.get('name')
    
    try:
        cert = Certificate.objects.get(certificate_id=cert_id)
        security_string = f"{name_to_check}|{cert_id}"
        recreated_hash = hashlib.sha256(security_string.encode()).hexdigest()
        
        if recreated_hash == cert.secure_hash:
            return JsonResponse({'status': 'verified', 'message': 'Certificate Verified Successfully'})
        else:
            return JsonResponse({'status': 'failed', 'message': 'Certificate Tampered or Invalid'}, status=400)
            
    except Certificate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Certificate ID not found'}, status=404)
