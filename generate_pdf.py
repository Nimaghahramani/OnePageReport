#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ماژول تولید فایل PDF با پشتیبانی کامل و اصولی از متون و کلمات فارسی
پروژه: تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر
مشاور: مهندسین مشاور اسکتیران (SCETIRAN) | پیمانکار: شرکت لؤلؤ کارون (LOICO)

این اسکریپت ۴ مرحله اصلی را اجرا می‌کند:
۱. بررسی و دانلود خودکار فونت استاندارد فارسی (Vazirmatn) و ثبت در ReportLab
۲. چسباندن صحیح حروف فارسی با استفاده از arabic-reshaper
۳. اصلاح جهت راست‌به‌چپ (RTL) با استفاده از تابع get_display در کتابخانه python-bidi
۴. اعمال تابع اصلاح‌کننده روی تمام متون خروجی، جداول، عناوین و تولید سند PDF استاندارد
"""

import os
import sys
import urllib.request

# کتابخانه‌های ReportLab برای ساخت PDF
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# کتابخانه‌های پردازش و چسباندن فونت‌های راست‌به‌چپ فارسی
import arabic_reshaper
from bidi.algorithm import get_display

# ==============================================================================
# مرحله ۱: دانلود و ثبت فونت استاندارد فارسی در ReportLab
# ==============================================================================
FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
FONT_REGULAR_PATH = os.path.join(FONTS_DIR, "Vazirmatn-Regular.ttf")
FONT_BOLD_PATH = os.path.join(FONTS_DIR, "Vazirmatn-Bold.ttf")

# آدرس‌های رسمی دریافت فونت متن‌باز وزیرمتن (Vazirmatn) از گیت‌هاب رسمی صابر راستی‌کردار
URL_VAZIR_REGULAR = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Regular.ttf"
URL_VAZIR_BOLD = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Bold.ttf"

def ensure_font_downloaded():
    """دانلود خودکار فونت فارسی استاندارد در صورت عدم وجود روی سیستم"""
    os.makedirs(FONTS_DIR, exist_ok=True)
    
    font_files = [
        (FONT_REGULAR_PATH, URL_VAZIR_REGULAR, "Vazirmatn-Regular.ttf"),
        (FONT_BOLD_PATH, URL_VAZIR_BOLD, "Vazirmatn-Bold.ttf")
    ]
    
    for local_path, url, filename in font_files:
        if not os.path.exists(local_path):
            print(f"[Font Setup] Downloading {filename} from official repository...")
            try:
                urllib.request.urlretrieve(url, local_path)
                print(f"[Font Setup] {filename} successfully downloaded.")
            except Exception as e:
                # چنانچه سیستم آفلاین بود، چک فونت‌های محلی پروژه
                fallback_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "fonts", "BNazanin.ttf")
                if os.path.exists(fallback_path):
                    print(f"[Font Setup] Using fallback local font: {fallback_path}")
                    return fallback_path, fallback_path
                raise RuntimeError(f"Failed to download font {filename}: {e}")
                
    return FONT_REGULAR_PATH, FONT_BOLD_PATH

def register_persian_fonts():
    """ثبت فونت‌ها در موتور گزارش‌ساز ReportLab"""
    reg_path, bold_path = ensure_font_downloaded()
    
    pdfmetrics.registerFont(TTFont('Vazirmatn', reg_path))
    pdfmetrics.registerFont(TTFont('Vazirmatn-Bold', bold_path))
    print("[Font Setup] Persian fonts 'Vazirmatn' and 'Vazirmatn-Bold' registered in ReportLab.")

# ==============================================================================
# مراحل ۲ و ۳: چسباندن حروف فارسی (Reshaper) و اصلاح جهت RTL (Bidi)
# ==============================================================================
# تنظیمات پیشرفته arabic_reshaper برای پشتیبانی از حروف گ، چ، پ، ژ و ارقام فارسی
reshaper_config = {
    'delete_harakat': False,
    'support_ligatures': True,
    'RIAL SIGN': True,
    'use_unshaped_instead_of_isolated': False,
}
persian_reshaper = arabic_reshaper.ArabicReshaper(configuration=reshaper_config)

def fix_persian(text):
    """
    تابع اصلی اصلاح رشته‌های فارسی:
    ۱. چسباندن حروف و جایگزینی فرم‌های میانی و پایانی (arabic_reshaper)
    ۲. معکوس‌سازی ترتیب نمایش کلمات برای موتورهای چاپ فاقد پشتیبانی مستقیم RTL (python-bidi)
    """
    if text is None:
        return ""
    text_str = str(text).strip()
    if not text_str:
        return ""
        
    # مرحله ۲: چسباندن گلیف‌ها
    reshaped_text = persian_reshaper.reshape(text_str)
    
    # مرحله ۳: اعمال الگوریتم دوطرفه (BiDi)
    bidi_text = get_display(reshaped_text)
    
    return bidi_text

# ==============================================================================
# مرحله ۴: نمونه کامل ایجاد گزارش اجرایی با متون و جداول فارسی
# ==============================================================================
def create_sample_executive_report(output_filename="Executive_Report_Persian.pdf"):
    """
    تولید یک سند PDF سازمانی دو زبانه با رعایت دقیق اصلاحات متنی
    """
    register_persian_fonts()
    
    # تنظیم ابعاد افقی A4 Landscape (یا A3)
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=landscape(A4),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    # استایل‌های پاراگراف با فونت فارسی ثبت شده
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'PersianHeader',
        parent=styles['Normal'],
        fontName='Vazirmatn-Bold',
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f2d59')
    )
    
    subheader_style = ParagraphStyle(
        'PersianSubHeader',
        parent=styles['Normal'],
        fontName='Vazirmatn',
        fontSize=10,
        leading=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )
    
    cell_right_style = ParagraphStyle(
        'PersianCellRight',
        parent=styles['Normal'],
        fontName='Vazirmatn',
        fontSize=9,
        leading=13,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0f172a')
    )

    cell_bold_style = ParagraphStyle(
        'PersianCellBold',
        parent=styles['Normal'],
        fontName='Vazirmatn-Bold',
        fontSize=9,
        leading=13,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#1e293b')
    )

    cell_center_style = ParagraphStyle(
        'PersianCellCenter',
        parent=styles['Normal'],
        fontName='Vazirmatn',
        fontSize=9,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f172a')
    )

    elements = []
    
    # ۱. سربرگ گزارش (عنوان پروژه، مشاور و پیمانکار)
    title_raw = "گزارش پیشرفت و وضعیت اجرایی پروژه تکمیل و تجهیز اسکله P1 بندر پتروشیمی ماهشهر"
    partners_raw = "مهندسین مشاور اسکتیران (SCETIRAN) | پیمانکار: شرکت لؤلؤ کارون (LOICO)"
    
    elements.append(Paragraph(fix_persian(title_raw), header_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(fix_persian(partners_raw), subheader_style))
    elements.append(Spacer(1, 14))
    
    # ۲. جدول اطلاعات قرارداد و مشخصات مالی
    contract_info_data = [
        [
            Paragraph(fix_persian("اطلاعات و مشخصات پایه قرارداد"), cell_bold_style),
            Paragraph(fix_persian("مقدار ریالی / ارزی"), cell_bold_style),
            Paragraph(fix_persian("شاخص عملکردی پروژه"), cell_bold_style),
            Paragraph(fix_persian("مقدار ثبت‌شده"), cell_bold_style)
        ],
        [
            Paragraph(fix_persian("مبلغ ریالی اولیه قرارداد:"), cell_right_style),
            Paragraph(fix_persian("۱,۷۴۹,۰۰۰,۰۰۰,۰۰۰ ریال"), cell_center_style),
            Paragraph(fix_persian("پیشرفت برنامه‌ای (PMS):"), cell_right_style),
            Paragraph(fix_persian("۹۱.۹۸٪"), cell_center_style)
        ],
        [
            Paragraph(fix_persian("مبلغ ارزی اولیه قرارداد:"), cell_right_style),
            Paragraph(fix_persian("۱,۵۲۱,۴۲۲ یورو"), cell_center_style),
            Paragraph(fix_persian("پیشرفت واقعی کل:"), cell_right_style),
            Paragraph(fix_persian("۸۹.۸۴٪"), cell_center_style)
        ],
        [
            Paragraph(fix_persian("جمع کل صورت‌وضعیت تأییدشده:"), cell_right_style),
            Paragraph(fix_persian("۱,۹۳۹,۰۸۶,۷۶۳,۹۲۸ ریال"), cell_center_style),
            Paragraph(fix_persian("انحراف از برنامه زمان‌بندی:"), cell_right_style),
            Paragraph(fix_persian("۲.۱۴- ٪ (تأخیر جزئی)"), cell_center_style)
        ]
    ]
    
    t_contract = Table(contract_info_data, colWidths=[180, 160, 160, 140])
    t_contract.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_contract)
    elements.append(Spacer(1, 16))
    
    # ۳. جدول موانع، مشکلات و ریسک‌های کلیدی (۴ مورد ثبت‌شده)
    issues_heading = Paragraph(fix_persian("موانع، مشکلات و ریسک‌های کلیدی پروژه (۴ مورد فعال):"), cell_bold_style)
    elements.append(issues_heading)
    elements.append(Spacer(1, 6))
    
    raw_issues = [
        ("۱", "عدم تعیین تکلیف تهیه کسری اقلام برق و ابزار دقیق", "بحرانی (تجهیزات و متریال)", "کارفرما / مشاور"),
        ("۲", "عدم تعیین تکلیف کسری بازوهای بارگیری جهت خرید و ارسال به سایت", "بحرانی (بازوهای بارگیری)", "دستگاه نظارت"),
        ("۳", "عدم تعیین تکلیف دستور کار و قیمت جدید عملیات اصلاح لودینگ آرم", "مالی و اجرایی", "کمیسیون معاملات"),
        ("۴", "تعیین تکلیف مخزن WO جهت انجام عملیات اجرایی", "عملیات سایت و لوله‌کشی", "پیمانکار / کارفرما")
    ]
    
    issues_table_data = [
        [
            Paragraph(fix_persian("ردیف"), cell_bold_style),
            Paragraph(fix_persian("شرح مانع / مشکل شناسایی‌شده"), cell_bold_style),
            Paragraph(fix_persian("حوزه تأثیر و اولویت"), cell_bold_style),
            Paragraph(fix_persian("مسئول پیگیری"), cell_bold_style)
        ]
    ]
    
    for row_num, desc, category, resp in raw_issues:
        issues_table_data.append([
            Paragraph(fix_persian(row_num), cell_center_style),
            Paragraph(fix_persian(desc), cell_right_style),
            Paragraph(fix_persian(category), cell_center_style),
            Paragraph(fix_persian(resp), cell_center_style)
        ])
        
    t_issues = Table(issues_table_data, colWidths=[35, 345, 140, 120])
    t_issues.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fee2e2')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fca5a5')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_issues)
    elements.append(Spacer(1, 16))
    
    # ۴. ساخت و رندر سند نهایی
    doc.build(elements)
    print(f"[PDF Generator] Output PDF successfully created: {output_filename}")
    return output_filename

if __name__ == '__main__':
    output_pdf_path = "Mahshahr_Jetty_P1_Report.pdf"
    if len(sys.argv) > 1:
        output_pdf_path = sys.argv[1]
    create_sample_executive_report(output_pdf_path)
