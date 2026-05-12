from django.db import models

class Certificate(models.Model):
    certificate_id = models.CharField(max_length=100, unique=True)
    recipient_name = models.CharField(max_length=200)
    secure_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient_name} ({self.certificate_id})"
