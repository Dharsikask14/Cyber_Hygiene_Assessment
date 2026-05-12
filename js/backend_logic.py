import hashlib
import qrcode
from django.db import models
from django.http import JsonResponse
from django.shortcuts import render

# settings.py snippets
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'cyber_hygiene_db',
#         'USER': 'root',
#         'PASSWORD': '',
#         'HOST': '127.0.0.1',
#         'PORT': '3306',
#     }
# }

# models.py
class Certificate(models.Model):
    certificate_id = models.CharField(max_length=100, unique=True)
    recipient_name = models.CharField(max_length=200)
    secure_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient_name} ({self.certificate_id})"

# views.py
def generate_certificate(request):
    name = request.GET.get('name')
    cert_id = request.GET.get('id')
    
    if not name or not cert_id:
        return JsonResponse({'error': 'Name and ID required'}, status=400)
    
    # Create security string
    security_string = f"{name}|{cert_id}"
    
    # Generate SHA-256 hash
    secure_hash = hashlib.sha256(security_string.encode()).hexdigest()
    
    # Save to Database
    cert, created = Certificate.objects.get_or_create(
        certificate_id=cert_id,
        defaults={'recipient_name': name, 'secure_hash': secure_hash}
    )
    
    # Generate QR Code URL
    verify_url = f"http://127.0.0.1:8000/verify/{cert_id}/"
    qr = qrcode.make(verify_url)
    # (Logic to save/return QR image would go here)
    
    return JsonResponse({
        'status': 'success',
        'id': cert_id,
        'hash': secure_hash,
        'verify_url': verify_url
    })

def verify_certificate(request, cert_id):
    name_to_check = request.GET.get('name')
    
    try:
        cert = Certificate.objects.get(certificate_id=cert_id)
        
        # Recreate hash with input name
        security_string = f"{name_to_check}|{cert_id}"
        recreated_hash = hashlib.sha256(security_string.encode()).hexdigest()
        
        if recreated_hash == cert.secure_hash:
            return JsonResponse({'status': 'verified', 'message': 'Certificate Verified Successfully'})
        else:
            return JsonResponse({'status': 'failed', 'message': 'Certificate Tampered or Invalid'}, status=400)
            
    except Certificate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Certificate ID not found'}, status=404)
