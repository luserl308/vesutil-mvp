from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# 1. Пользователи (Кастомная модель)
class User(AbstractUser):
    ROLE_CHOICES = (
        ('buyer_ur', 'Покупатель (Юр. лицо)'),
        ('buyer_fiz', 'Покупатель (Физ. лицо / Менеджер)'),
        ('seller', 'Продавец (Сдатчик)'),
        ('admin', 'Администратор'),
    )
    role = models.CharField('Роль', max_length=15, choices=ROLE_CHOICES, default='seller')
    inn = models.CharField('ИНН', max_length=12, blank=True, null=True)
    company_name = models.CharField('Название организации', max_length=255, blank=True, null=True)
    address_legal = models.CharField('Юридический адрес', max_length=255, blank=True, null=True)
    phone = models.CharField('Телефон', max_length=20, blank=True, null=True)
    email_confirmed = models.BooleanField('Email подтвержден', default=False)
    
    # Система оплаты в "баллах"
    balance_points = models.IntegerField('Баланс (баллы)', default=0) 
    clicks_left = models.IntegerField('Остаток кликов', default=100) # Стартовый пакет
    tariff_end_date = models.DateTimeField('Дата окончания тарифа', blank=True, null=True)
    
    # Настройки уведомлений (из админки)
    notify_days_before_end = models.IntegerField('За сколько дней предупреждать об окончании', default=5)
    notify_days_no_update = models.IntegerField('Через сколько дней напоминать об обновлении', default=5)

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.company_name or self.username


# 2. Справочник сырья
class Material(models.Model):
    name = models.CharField('Название материала', max_length=100) # Металлолом, Мусор...
    is_waste = models.BooleanField('Это мусор (сортировка по возрастанию)', default=False)

    class Meta:
        verbose_name = 'Материал'
        verbose_name_plural = 'Справочник материалов'

    def __str__(self):
        return self.name


# 3. Пункты приема
class Branch(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='branches', verbose_name='Владелец')
    name = models.CharField('Название (для ЛК)', max_length=100)
    address = models.CharField('Адрес (для выдачи)', max_length=255)
    latitude = models.FloatField('Широта', null=True, blank=True)
    longitude = models.FloatField('Долгота', null=True, blank=True)
    delivery_type = models.CharField('Тип доставки', max_length=50, blank=True) # Самовывоз, ЖД...
    transport_types = models.TextField('Виды транспорта', blank=True, null=True)

    class Meta:
        verbose_name = 'Пункт приема'
        verbose_name_plural = 'Пункты приема'

    def __str__(self):
        return f"{self.name} ({self.owner})"


# 4. Прайс-лист (версия)
class PriceList(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
        ('archived', 'Архив'),
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name='Пункт приема')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='Материал')
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)
    status = models.CharField('Статус', max_length=15, choices=STATUS_CHOICES, default='draft')
    file = models.FileField('Файл Excel', upload_to='pricelists/', blank=True, null=True)
    is_active = models.BooleanField('Активный прайс', default=True)
    allow_download = models.BooleanField('Разрешить скачивание клиентам', default=False)

    class Meta:
        verbose_name = 'Прайс-лист'
        verbose_name_plural = 'Прайс-листы'

    def __str__(self):
        return f"Прайс {self.branch.name} от {self.uploaded_at.strftime('%d.%m.%Y')}"


# 5. Строка прайса
class PriceItem(models.Model):
    price_list = models.ForeignKey(PriceList, on_delete=models.CASCADE, related_name='items', verbose_name='Прайс')
    name = models.CharField('Позиция', max_length=255) # "Алюминий 3А"
    price = models.DecimalField('Цена', max_digits=10, decimal_places=2)
    unit = models.CharField('Ед. изм.', max_length=20, default='руб/кг')
    extra_conditions = models.TextField('Прочие условия', blank=True)

    class Meta:
        verbose_name = 'Позиция прайса'
        verbose_name_plural = 'Позиции прайсов'

    def __str__(self):
        return f"{self.name} - {self.price} {self.unit}"


# 6. Логи кликов
class ClickLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Кто нажал (Продавец)', related_name='clicks_made')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Кому списали (Покупатель)', related_name='clicks_spent')
    price_item = models.ForeignKey(PriceItem, on_delete=models.CASCADE, verbose_name='Позиция прайса')
    timestamp = models.DateTimeField('Время', auto_now_add=True)
    ip_address = models.GenericIPAddressField('IP-адрес', null=True, blank=True)

    class Meta:
        verbose_name = 'Клик (списание)'
        verbose_name_plural = 'Логи кликов'


# 7. Отзывы
class Review(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='written_reviews', verbose_name='Автор')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews', verbose_name='Кому оставили')
    rating = models.IntegerField('Оценка (1-5)')
    text = models.TextField('Текст отзыва')
    created_at = models.DateTimeField('Дата', auto_now_add=True)

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'


# 8. Логи поиска (Для аналитики и словаря опечаток)
class SearchLog(models.Model):
    query_text = models.CharField('Поисковый запрос', max_length=255)
    is_successful = models.BooleanField('Были ли результаты', default=False)
    geo_location = models.CharField('Геолокация', max_length=100, blank=True, null=True)
    created_at = models.DateTimeField('Дата', auto_now_add=True)

    class Meta:
        verbose_name = 'Поисковый запрос'
        verbose_name_plural = 'Статистика запросов'
