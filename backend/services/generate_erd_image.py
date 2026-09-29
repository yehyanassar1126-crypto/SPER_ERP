import os
import asyncio
from playwright.async_api import async_playwright

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ninja Smart Factory ERP - Entity Relationship Diagram</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0b1120;
    color: #e2e8f0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    padding: 30px;
    width: 3200px;
  }
  .header {
    text-align: center;
    margin-bottom: 25px;
    padding: 20px;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 12px;
    border: 1px solid #334155;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .header h1 {
    font-size: 32px;
    font-weight: 800;
    color: #38bdf8;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .header p {
    font-size: 16px;
    color: #94a3b8;
  }
  .badge-container {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  .badge {
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 25px;
  }
  .domain-card {
    background: #1e293b;
    border-radius: 10px;
    border: 1px solid #334155;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }
  .domain-header {
    padding: 12px 18px;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .domain-body {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  /* Tables */
  .table-box {
    background: #0f172a;
    border-radius: 8px;
    border: 1px solid #334155;
    overflow: hidden;
  }
  .table-title {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    display: flex;
    justify-content: space-between;
  }
  .table-rows {
    padding: 6px 12px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 11.5px;
    line-height: 1.6;
  }
  .row-field {
    display: flex;
    justify-content: space-between;
    padding: 1px 0;
    border-bottom: 1px solid #1e293b;
  }
  .row-field:last-child { border-bottom: none; }
  .pk { color: #f59e0b; font-weight: bold; }
  .fk { color: #38bdf8; font-weight: bold; }
  .type { color: #64748b; font-size: 10.5px; }

  /* Colors per domain */
  .c-core { border-top: 4px solid #6366f1; }
  .c-core .domain-header { background: #312e81; color: #a5b4fc; }
  
  .c-hr { border-top: 4px solid #10b981; }
  .c-hr .domain-header { background: #064e3b; color: #6ee7b7; }
  
  .c-prod { border-top: 4px solid #f59e0b; }
  .c-prod .domain-header { background: #78350f; color: #fcd34d; }
  
  .c-inv { border-top: 4px solid #06b6d4; }
  .c-inv .domain-header { background: #164e63; color: #67e8f9; }
  
  .c-proc { border-top: 4px solid #ec4899; }
  .c-proc .domain-header { background: #831843; color: #f472b6; }
  
  .c-sales { border-top: 4px solid #8b5cf6; }
  .c-sales .domain-header { background: #4c1d95; color: #c4b5fd; }
  
  .c-maint { border-top: 4px solid #ef4444; }
  .c-maint .domain-header { background: #7f1d1d; color: #fca5a5; }
  
  .c-fleet { border-top: 4px solid #14b8a6; }
  .c-fleet .domain-header { background: #134e4a; color: #5eead4; }

  .c-fin { border-top: 4px solid #eab308; }
  .c-fin .domain-header { background: #713f12; color: #fde047; }

  .rel-bar {
    grid-column: span 4;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 15px 25px;
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    font-size: 13px;
    color: #94a3b8;
  }
  .rel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #0f172a;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #334155;
  }
  .rel-item b { color: #38bdf8; }
</style>
</head>
<body>

<div class="header">
  <h1>NINJA SMART FACTORY ERP - SYSTEM ENTITY RELATIONSHIP DIAGRAM (ERD)</h1>
  <p>Industrial Manufacturing Architecture & Data Model | 77 Screens Integration Across 15 Core Departments</p>
  <div class="badge-container">
    <span class="badge" style="background:#312e81; color:#c7d2fe;">Single-Tenant Industrial Architecture</span>
    <span class="badge" style="background:#064e3b; color:#a7f3d0;">9 Operational Domains</span>
    <span class="badge" style="background:#78350f; color:#fde68a;">Full Relational Lifecycle (Sales → Prod → Fin)</span>
    <span class="badge" style="background:#831843; color:#fbcfe8;">RBAC & Audit Trail Enforced</span>
  </div>
</div>

<div class="grid-container">

  <!-- 1. CORE & SECURITY -->
  <div class="domain-card c-core">
    <div class="domain-header">
      <span>1. Security, Audit & Admin Core</span>
      <span style="font-size:12px; opacity:0.8;">IT / Owner</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>users</span><span class="type">Core User Auth</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>username</span><span class="type">VARCHAR(60)</span></div>
          <div class="row-field"><span>password_hash</span><span class="type">VARCHAR(255)</span></div>
          <div class="row-field"><span class="fk">role_id (FK)</span><span class="type">INT → roles</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(ACTIVE, SUSP)</span></div>
          <div class="row-field"><span>created_at</span><span class="type">TIMESTAMP</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>roles & role_permissions</span><span class="type">RBAC Engine</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT</span></div>
          <div class="row-field"><span class="fk">role_id (FK)</span><span class="type">INT → roles</span></div>
          <div class="row-field"><span>screen_identifier</span><span class="type">VARCHAR(80)</span></div>
          <div class="row-field"><span>can_view / can_create</span><span class="type">BOOLEAN</span></div>
          <div class="row-field"><span>can_edit / can_delete</span><span class="type">BOOLEAN</span></div>
          <div class="row-field"><span>can_approve / can_reject</span><span class="type">BOOLEAN</span></div>
          <div class="row-field"><span>can_export / can_print</span><span class="type">BOOLEAN</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>audit_logs</span><span class="type">Screen 4: سجل العمليات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">user_id (FK)</span><span class="type">BIGINT → users</span></div>
          <div class="row-field"><span>screen_name</span><span class="type">VARCHAR(100)</span></div>
          <div class="row-field"><span>action_type</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span>ip_address / device</span><span class="type">VARCHAR(45)</span></div>
          <div class="row-field"><span>payload_snapshot</span><span class="type">JSON</span></div>
          <div class="row-field"><span>timestamp</span><span class="type">DATETIME</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>smart_rules_ai</span><span class="type">Screen 5 & 58: العقل والذكاء</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT</span></div>
          <div class="row-field"><span>rule_name</span><span class="type">VARCHAR(100)</span></div>
          <div class="row-field"><span>trigger_event</span><span class="type">VARCHAR(80)</span></div>
          <div class="row-field"><span>conditions_json</span><span class="type">JSON</span></div>
          <div class="row-field"><span>action_payload</span><span class="type">JSON</span></div>
          <div class="row-field"><span>is_active</span><span class="type">BOOLEAN</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. HR & EMPLOYEE PORTAL -->
  <div class="domain-card c-hr">
    <div class="domain-header">
      <span>2. HR, Workforce & Employee Portal</span>
      <span style="font-size:12px; opacity:0.8;">HR & Employee Self-Service</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>employees</span><span class="type">Screen 29 & 65: الملف والموظف</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span class="fk">user_id (FK)</span><span class="type">BIGINT → users</span></div>
          <div class="row-field"><span>emp_code / national_id</span><span class="type">VARCHAR(30)</span></div>
          <div class="row-field"><span>full_name / job_title</span><span class="type">VARCHAR(120)</span></div>
          <div class="row-field"><span class="fk">department_id (FK)</span><span class="type">INT → departments</span></div>
          <div class="row-field"><span class="fk">current_shift_id (FK)</span><span class="type">INT → shifts</span></div>
          <div class="row-field"><span>basic_salary</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>hire_date / status</span><span class="type">DATE, ENUM</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>attendance_punches</span><span class="type">Screen 30, 66, 67, 68</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">employee_id (FK)</span><span class="type">BIGINT → employees</span></div>
          <div class="row-field"><span class="fk">shift_id (FK)</span><span class="type">INT → shifts</span></div>
          <div class="row-field"><span>punch_in / punch_out</span><span class="type">DATETIME</span></div>
          <div class="row-field"><span>work_hours / lateness_mins</span><span class="type">DECIMAL(5,2), INT</span></div>
          <div class="row-field"><span>location_geo / device_ip</span><span class="type">VARCHAR(100)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>leave_requests</span><span class="type">Screen 34 & 69: الإجازات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">employee_id (FK)</span><span class="type">BIGINT → employees</span></div>
          <div class="row-field"><span>leave_type</span><span class="type">ENUM(ANNUAL, SICK, CASUAL)</span></div>
          <div class="row-field"><span>start_date / end_date</span><span class="type">DATE</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(PENDING, APPR, REJ)</span></div>
          <div class="row-field"><span class="fk">approved_by (FK)</span><span class="type">BIGINT → employees</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>payrolls & salary_advances</span><span class="type">Screen 37, 44, 70, 72</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">employee_id (FK)</span><span class="type">BIGINT → employees</span></div>
          <div class="row-field"><span>pay_month / pay_year</span><span class="type">INT</span></div>
          <div class="row-field"><span>basic_pay + allowances</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>overtime_pay + friday_pay</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>deductions_loans_penalties</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>net_salary / status</span><span class="type">DECIMAL(12,2), ENUM</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. PRODUCTION & ENGINEERING -->
  <div class="domain-card c-prod">
    <div class="domain-header">
      <span>3. Production, Engineering & Quality</span>
      <span style="font-size:12px; opacity:0.8;">Factory Operations</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>products & bom</span><span class="type">Screen 13 & 18: المنتجات والـ BOM</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>product_sku / name</span><span class="type">VARCHAR(60)</span></div>
          <div class="row-field"><span>unit_of_measure</span><span class="type">VARCHAR(20)</span></div>
          <div class="row-field"><span>std_cost / sale_price</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>bom_revision_code</span><span class="type">VARCHAR(30)</span></div>
          <div class="row-field"><span class="fk">cad_drawing_id (FK)</span><span class="type">INT → engineering_docs</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>bom_items (Recipe)</span><span class="type">مكونات المنتج ونسب الهدر</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">parent_product_id (FK)</span><span class="type">BIGINT → products</span></div>
          <div class="row-field"><span class="fk">raw_material_id (FK)</span><span class="type">BIGINT → products</span></div>
          <div class="row-field"><span>required_quantity</span><span class="type">DECIMAL(12,4)</span></div>
          <div class="row-field"><span>waste_tolerance_pct</span><span class="type">DECIMAL(5,2)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>production_orders</span><span class="type">Screen 15 & 17: الخطة والأوامر</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>order_code</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span class="fk">product_id (FK)</span><span class="type">BIGINT → products</span></div>
          <div class="row-field"><span class="fk">sales_order_id (FK)</span><span class="type">BIGINT → sales_orders</span></div>
          <div class="row-field"><span>target_qty / actual_qty</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>scrap_qty / OEE_pct</span><span class="type">DECIMAL(12,2), FLOAT</span></div>
          <div class="row-field"><span class="fk">line_equipment_id (FK)</span><span class="type">INT → equipment</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(PLANNED, IN_PROG, DONE)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>quality_inspections</span><span class="type">Screen 21: فحوصات الجودة</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span>inspection_stage</span><span class="type">ENUM(INCOMING, INLINE, FINAL)</span></div>
          <div class="row-field"><span class="fk">production_order_id (FK)</span><span class="type">BIGINT → prod_orders</span></div>
          <div class="row-field"><span class="fk">lot_barcode_id (FK)</span><span class="type">BIGINT → traceability</span></div>
          <div class="row-field"><span>tested_sample_qty</span><span class="type">INT</span></div>
          <div class="row-field"><span>result</span><span class="type">ENUM(PASSED, REJECTED, HOLD)</span></div>
          <div class="row-field"><span class="fk">inspector_emp_id (FK)</span><span class="type">BIGINT → employees</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 4. WAREHOUSES & TRACEABILITY -->
  <div class="domain-card c-inv">
    <div class="domain-header">
      <span>4. Inventory, Warehouses & Tracking</span>
      <span style="font-size:12px; opacity:0.8;">Warehouses & Logistics</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>warehouses</span><span class="type">Screen 6: مخازن خام وتام وقطع</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT AUTO</span></div>
          <div class="row-field"><span>warehouse_name</span><span class="type">VARCHAR(80)</span></div>
          <div class="row-field"><span>wh_type</span><span class="type">ENUM(RAW, FINISHED, SPARE)</span></div>
          <div class="row-field"><span>location_address</span><span class="type">VARCHAR(150)</span></div>
          <div class="row-field"><span class="fk">manager_emp_id (FK)</span><span class="type">BIGINT → employees</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>stock_inventory</span><span class="type">الأرصدة الحالية وحدود الطلب</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span class="fk">warehouse_id (FK)</span><span class="type">INT → warehouses</span></div>
          <div class="row-field"><span class="fk">product_id (FK)</span><span class="type">BIGINT → products</span></div>
          <div class="row-field"><span>batch_lot_number</span><span class="type">VARCHAR(60)</span></div>
          <div class="row-field"><span>on_hand_qty / reserved</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>reorder_point</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>average_unit_cost</span><span class="type">DECIMAL(12,2)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>traceability_records</span><span class="type">Screen 19: تتبع الباركود والشحنات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span>barcode_serial_tag</span><span class="type">VARCHAR(100) UNIQUE</span></div>
          <div class="row-field"><span class="fk">product_id (FK)</span><span class="type">BIGINT → products</span></div>
          <div class="row-field"><span class="fk">production_order_id (FK)</span><span class="type">BIGINT → prod_orders</span></div>
          <div class="row-field"><span>raw_material_lot_origin</span><span class="type">VARCHAR(80)</span></div>
          <div class="row-field"><span>manufacture_timestamp</span><span class="type">DATETIME</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 5. PROCUREMENT & SUPPLIERS -->
  <div class="domain-card c-proc">
    <div class="domain-header">
      <span>5. Procurement & Vendors</span>
      <span style="font-size:12px; opacity:0.8;">Procurement</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>suppliers</span><span class="type">Screen 14 & 16: الموردين والتسجيل</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>supplier_name / tax_card</span><span class="type">VARCHAR(120)</span></div>
          <div class="row-field"><span>contact_person / phone</span><span class="type">VARCHAR(80)</span></div>
          <div class="row-field"><span>payment_terms_days</span><span class="type">INT</span></div>
          <div class="row-field"><span>rating_score</span><span class="type">DECIMAL(3,2)</span></div>
          <div class="row-field"><span>approval_status</span><span class="type">ENUM(PENDING, APPROVED)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>purchase_orders & items</span><span class="type">Screen 7: طلبات وأوامر الشراء</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>po_number</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span class="fk">supplier_id (FK)</span><span class="type">BIGINT → suppliers</span></div>
          <div class="row-field"><span>order_date / delivery_date</span><span class="type">DATE</span></div>
          <div class="row-field"><span>total_tax_amount</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>grand_total</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(RFQ, APPROVED, RECEIVED)</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. SALES & CUSTOMERS -->
  <div class="domain-card c-sales">
    <div class="domain-header">
      <span>6. Sales & Customer Portal</span>
      <span style="font-size:12px; opacity:0.8;">Sales & Customer Care</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>customers</span><span class="type">Screen 14 & 28: العملاء والبوابة</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>client_name / commercial_id</span><span class="type">VARCHAR(120)</span></div>
          <div class="row-field"><span>credit_limit_amount</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>current_debt_balance</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span class="fk">portal_user_id (FK)</span><span class="type">BIGINT → users</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(VERIFIED, HOLD)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>sales_orders & items</span><span class="type">Screen 12: أوامر البيع</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>so_number</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span class="fk">customer_id (FK)</span><span class="type">BIGINT → customers</span></div>
          <div class="row-field"><span>order_date / required_date</span><span class="type">DATE</span></div>
          <div class="row-field"><span>total_net_value</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(CONFIRMED, IN_PROD, SHIPPED)</span></div>
          <div class="row-field"><span class="fk">created_by_rep (FK)</span><span class="type">BIGINT → employees</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 7. MAINTENANCE & EQUIPMENT -->
  <div class="domain-card c-maint">
    <div class="domain-header">
      <span>7. Plant Maintenance & Equipment</span>
      <span style="font-size:12px; opacity:0.8;">Maintenance & Engineering</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>equipment</span><span class="type">Screen 24: المعدات والماكينات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT AUTO</span></div>
          <div class="row-field"><span>machine_tag_code</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span>machine_name / model</span><span class="type">VARCHAR(100)</span></div>
          <div class="row-field"><span>production_line_code</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span>current_running_status</span><span class="type">ENUM(RUNNING, DOWN, MAINT)</span></div>
          <div class="row-field"><span>power_kw / install_date</span><span class="type">FLOAT, DATE</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>maintenance_work_orders</span><span class="type">Screen 22, 23, 25</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span class="fk">equipment_id (FK)</span><span class="type">INT → equipment</span></div>
          <div class="row-field"><span>maintenance_type</span><span class="type">ENUM(PREVENTIVE, BREAKDOWN)</span></div>
          <div class="row-field"><span class="fk">contractor_company_id (FK)</span><span class="type">INT → maint_contractors</span></div>
          <div class="row-field"><span>fault_description / downtime_hrs</span><span class="type">TEXT, DECIMAL(5,2)</span></div>
          <div class="row-field"><span>spare_parts_cost</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>status</span><span class="type">ENUM(OPEN, IN_PROGRESS, CLOSED)</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 8. FLEET & LOGISTICS -->
  <div class="domain-card c-fleet">
    <div class="domain-header">
      <span>8. Fleet, Vehicles & Logistics</span>
      <span style="font-size:12px; opacity:0.8;">Fleet & Dispatch</span>
    </div>
    <div class="domain-body">
      <div class="table-box">
        <div class="table-title"><span>fleet_vehicles</span><span class="type">Screen 27: إدارة الأسطول</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT AUTO</span></div>
          <div class="row-field"><span>plate_number / chassis_no</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span>vehicle_type / payload_tons</span><span class="type">VARCHAR(50), FLOAT</span></div>
          <div class="row-field"><span>license_renewal_date</span><span class="type">DATE</span></div>
          <div class="row-field"><span>insurance_policy_details</span><span class="type">VARCHAR(100)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>vehicle_trips & driver_acc</span><span class="type">Screen 10 & 26: حركة وسائقين</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span class="fk">vehicle_id (FK)</span><span class="type">INT → fleet_vehicles</span></div>
          <div class="row-field"><span class="fk">driver_emp_id (FK)</span><span class="type">BIGINT → employees</span></div>
          <div class="row-field"><span>driver_type</span><span class="type">ENUM(INTERNAL, EXTERNAL_3PL)</span></div>
          <div class="row-field"><span>start_km / end_km</span><span class="type">BIGINT</span></div>
          <div class="row-field"><span>fuel_cost / trip_allowance</span><span class="type">DECIMAL(10,2)</span></div>
          <div class="row-field"><span class="fk">linked_sales_order (FK)</span><span class="type">BIGINT → sales_orders</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 9. GENERAL LEDGER & COST ACCOUNTING (SPAN 4) -->
  <div class="domain-card c-fin" style="grid-column: span 4;">
    <div class="domain-header">
      <span>9. Financial Management, Chart of Accounts & Cost Centers</span>
      <span style="font-size:12px; opacity:0.8;">Finance, Accounting & Cost Control (Screen 3, 8, 9, 45)</span>
    </div>
    <div class="domain-body" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      
      <div class="table-box">
        <div class="table-title"><span>chart_of_accounts</span><span class="type">Screen 9: شجرة الحسابات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT AUTO</span></div>
          <div class="row-field"><span>account_code (1 to 5)</span><span class="type">VARCHAR(30) UNIQUE</span></div>
          <div class="row-field"><span>account_name_ar / en</span><span class="type">VARCHAR(120)</span></div>
          <div class="row-field"><span>account_type</span><span class="type">ENUM(ASSET, LIAB, EQ, REV, EXP)</span></div>
          <div class="row-field"><span class="fk">parent_account_id (FK)</span><span class="type">INT → chart_of_accounts</span></div>
          <div class="row-field"><span>current_balance</span><span class="type">DECIMAL(15,2)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>journal_entries & lines</span><span class="type">Screen 8: الإدارة المالية</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span>entry_serial_number</span><span class="type">VARCHAR(50)</span></div>
          <div class="row-field"><span>entry_date / status</span><span class="type">DATE, ENUM(POSTED, DRAFT)</span></div>
          <div class="row-field"><span class="fk">account_id (FK)</span><span class="type">INT → chart_of_accounts</span></div>
          <div class="row-field"><span>debit_amount / credit_amount</span><span class="type">DECIMAL(15,2)</span></div>
          <div class="row-field"><span class="fk">cost_center_dept_id (FK)</span><span class="type">INT → departments</span></div>
          <div class="row-field"><span>source_document_ref</span><span class="type">VARCHAR(100)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>department_costs</span><span class="type">Screen 3: تكلفة الإدارات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">INT AUTO</span></div>
          <div class="row-field"><span class="fk">department_id (FK)</span><span class="type">INT → departments</span></div>
          <div class="row-field"><span>fiscal_month / fiscal_year</span><span class="type">INT</span></div>
          <div class="row-field"><span>budgeted_allowance</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>actual_payroll_cost</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>actual_operational_cost</span><span class="type">DECIMAL(12,2)</span></div>
          <div class="row-field"><span>variance_deviation</span><span class="type">DECIMAL(12,2)</span></div>
        </div>
      </div>

      <div class="table-box">
        <div class="table-title"><span>expense_claims</span><span class="type">Screen 45 & 76: المصروفات</span></div>
        <div class="table-rows">
          <div class="row-field"><span class="pk">id (PK)</span><span class="type">BIGINT AUTO</span></div>
          <div class="row-field"><span class="fk">employee_id (FK)</span><span class="type">BIGINT → employees</span></div>
          <div class="row-field"><span class="fk">department_id (FK)</span><span class="type">INT → departments</span></div>
          <div class="row-field"><span>expense_category</span><span class="type">VARCHAR(60)</span></div>
          <div class="row-field"><span>receipt_invoice_file</span><span class="type">VARCHAR(255)</span></div>
          <div class="row-field"><span>claim_amount</span><span class="type">DECIMAL(10,2)</span></div>
          <div class="row-field"><span>approval_finance_status</span><span class="type">ENUM(PENDING, APPROVED)</span></div>
        </div>
      </div>

    </div>
  </div>

  <!-- RELATIONSHIP FOOTER BAR -->
  <div class="rel-bar">
    <div class="rel-item"><span>Sales → Production:</span> <b>sales_orders (1) ── (N) production_orders</b></div>
    <div class="rel-item"><span>BOM & Materials:</span> <b>products (1) ── (N) bom_items ── (1) inventory_stock</b></div>
    <div class="rel-item"><span>Production → QC:</span> <b>production_orders (1) ── (N) quality_inspections</b></div>
    <div class="rel-item"><span>HR → Payroll:</span> <b>employees (1) ── (N) attendance / leaves / loans ── (1) payrolls</b></div>
    <div class="rel-item"><span>Maintenance → Parts:</span> <b>equipment (1) ── (N) maintenance_orders ── (N) spare_parts_cycle</b></div>
    <div class="rel-item"><span>Logistics → Finance:</span> <b>vehicle_trips (N) ── (1) driver_accounts ── (1) journal_entries</b></div>
    <div class="rel-item"><span>All Modules → GL:</span> <b>All Operational Transactions ── Auto Journal Posting ── (1) chart_of_accounts</b></div>
  </div>

</div>

</body>
</html>
"""

async def generate_erd_image():
    html_path = os.path.abspath("ninja_erd.html")
    png_path = os.path.abspath("ninja_smart_factory_erd.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 3200, "height": 2200})
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"ERD Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_erd_image())
