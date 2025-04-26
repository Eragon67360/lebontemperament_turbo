import os
import json
from datetime import datetime

def get_pdf_files_details(directory):
    pdf_files_details = []
    for file in os.listdir(directory):
        if file.endswith(".pdf"):
            # Extracting the date from the file name assuming it ends with a date like '23-01-09'
            date_str = file.split()[-1].rstrip('.pdf')
            try:
                date_obj = datetime.strptime('20' + date_str, '%Y-%m-%d')
            except ValueError as e:
                # If there's an issue parsing the date, you can set a default date far in the past
                date_obj = datetime.min
                
            pdf_files_details.append({
                'name': file,
                'date': date_obj,  # Store the date string separately for easy access
            })
    # Sort the list by 'date', with newer dates first
    pdf_files_details.sort(key=lambda x: x['date'], reverse=True)

    # Optionally, convert 'date' back to a string or another format before writing to JSON, if desired
    for detail in pdf_files_details:
        detail['date'] = detail['date'].strftime('%d-%m-%Y')  # Convert datetime object back to string in 'YYYY-MM-DD' format


    return pdf_files_details

directory = '../public/pdf/CA'  # Update this to the path of your PDF folder
pdf_details = get_pdf_files_details(directory)

with open('../public/json/pdf_filesCA.json', 'w') as f:
    json.dump(pdf_details, f, indent=4)

print("PDF files details have been written to pdf_filesCA.json.")
