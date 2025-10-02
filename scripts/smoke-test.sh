#!/usr/bin/env bash
set -euo pipefail
base="https://bemacho.netlify.app"

echo "Testing POST /api/inventory"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$base/api/inventory" -H "Content-Type: application/json" -d '{"type":"addition","quantity":5,"note":"smoke test"}'

echo "\nTesting POST /api/sales"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$base/api/sales" -H "Content-Type: application/json" -d '{"customerId":1,"quantity":2,"pricePerUnit":3}'

echo "\nTesting POST /api/customers"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$base/api/customers" -H "Content-Type: application/json" -d '{"name":"Smoke Tester"}'

echo "\nTesting POST /api/ingredients"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$base/api/ingredients" -H "Content-Type: application/json" -d '{"name":"smoke","multiplier":1}'

echo "\nTesting POST /api/export/email"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$base/api/export/email" -H "Content-Type: application/json" -d '{"pdfBase64":"dGVzdA==","filename":"smoke.pdf"}'
