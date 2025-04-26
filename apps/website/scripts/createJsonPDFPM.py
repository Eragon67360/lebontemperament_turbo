import os
import json
import re

def get_pdf_files_details(directory):
    pdf_files_details = []
    for file in os.listdir(directory):
        if file.endswith(".pdf"):
            match = re.search(r'\d{1}', file)
            if match:
                number = match.group(0)
            else:
                number = ""
            
            pdf_files_details.append({
                'name': file,
                'date': number,  # Store the year separately for easy access
            })
            
    pdf_files_details.sort(key=lambda x: x['date'] if x['date'].isdigit() else "0", reverse=True)

    return pdf_files_details

directory = '../public/pdf/PM'  # Update this to the path of your PDF folder
pdf_details = get_pdf_files_details(directory)

with open('../public/json/pdf_filesPM.json', 'w') as f:
    json.dump(pdf_details, f, indent=4)

print("PDF files details have been written to pdf_filesPM.json.")
