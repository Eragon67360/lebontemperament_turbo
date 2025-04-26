import os
import json
import re

def get_pdf_files_details(directory):
    pdf_files_details = []
    for file in os.listdir(directory):
        if file.endswith(".pdf"):
            # Use a regular expression to find a four-digit number (year) in the file name
            match = re.search(r'\d{4}', file)
            if match:
                year = match.group(0)  # The first match will be the year
            else:
                year = "Unknown"  # Default value if no year is found
            
            pdf_files_details.append({
                'name': file,
                'date': year,  # Store the year separately for easy access
            })
            
    pdf_files_details.sort(key=lambda x: x['date'] if x['date'].isdigit() else "0000", reverse=True)

    return pdf_files_details

directory = '../public/pdf/AG'  # Update this to the path of your PDF folder
pdf_details = get_pdf_files_details(directory)

with open('../public/json/pdf_filesAG.json', 'w') as f:
    json.dump(pdf_details, f, indent=4)

print("PDF files details have been written to pdf_filesAG.json.")
