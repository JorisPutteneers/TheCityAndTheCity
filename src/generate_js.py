
import os
import json
import shutil
from natsort import natsorted
import re
import subprocess
from pdf2image import convert_from_path
import math
from PIL import Image

# preprocessing functions

def resize_file_if_large(filePath, maxBytes): #100 000 000 bytes is 100mb
    file_size = os.path.getsize(filePath)
    if file_size > maxBytes:
        print(f"{filePath} is too big with {file_size}bytes. It will be modified. Max bytes is {maxBytes}")
        command = f'convert "{filePath}" -resize 512x -quality 80 "{filePath}"'
        # print(os.path.splitext(filePath)[1])
        if os.path.splitext(filePath)[1] == ".gif": #check if gif
            # command = f'convert "{filePath}" -coalesce -resize 512x -colors 64 -deconstruct "{filePath}"'
            command = f'convert "{filePath}"  -resize 512x -colors 64 "{filePath}"'
            # print("testing if gid is complete lenght")

        subprocess.run(command, shell=True)
        
def remove_unsupported_file(file_path):
    if os.path.isfile(file_path):
        supported_extensions = (".jpg", ".png", ".jpeg", ".txt", ".gif", ".pdf")
        if not file_path.lower().endswith(supported_extensions):
            os.remove(file_path)
            print(f'{file_path} is not supported and is removed, please use one of the supported extensions {supported_extensions}')

def remove_too_big(file_path, maxWidth, maxHeight):
    if os.path.isfile(file_path):
        imageToProcess = Image.open(file_path)
        width, height = imageToProcess.size

        if width > maxWidth or height > maxHeight:
            print("Too big to process.")
            os.remove(file_path)

def preProcessImages(item, week_folder_path, nestedDir=None):
    item_path = os.path.join(week_folder_path, item)   
    if os.path.isfile(item_path):
        if item_path.lower().endswith((".jpg", ".png", ".jpeg")):


            processed_dir = os.path.join(week_folder_path, "processed")
            optionalArgs = "-fuzz 10% -transparent white"
            resizeArg = "-resize 512x512 "
            print(f"processing {item}")    

            if nestedDir != None:
                print("nested directory -images- is activated")
                processed_dir = os.path.join(nestedDir, "processed")
                optionalArgs = "-fuzz 20% -transparent white  "  #-negate
                
            # if filename contains "long" in filename, set resize to 512x512
            if "long" in os.path.splitext(item)[0]:
                resizeArg = "-resize x512 "
                print("contains long")
            
            os.makedirs(processed_dir, exist_ok=True)
            # saveImg = os.path.splitext(item)[0] + "_pr" + os.path.splitext(item)[1] #save img with given extension
            saveImg = os.path.splitext(item)[0] + "_pr.png" #save img with given extension
            processed_path = os.path.join(processed_dir, saveImg)

            remove_too_big(item_path, 10000, 10000)
            os.system(f'convert "{item_path}" {resizeArg} -interpolate nearest-neighbor -sharpen 0x2 -quality 50 {optionalArgs} "{processed_path}"')

            
            resize_file_if_large(item_path, 1000000) #1mb max, for uploading mainly

            images.append("../" + processed_path) #save normal pdfs so it diplays in info
            week.append(processed_path) #save alpha pdfs so it diplays in three.js


def preProcessText(item, week_folder_path, nestedDir=None):
    item_path = os.path.join(week_folder_path, item)   
    if os.path.isfile(item_path):
        if item_path.lower().endswith((".txt")):
            processed_dir = os.path.join(week_folder_path, "processed")

            textColor = "white"
            textId = "textInfo"

            if nestedDir != None:
                print("nested directory -text- is activated")
                processed_dir = os.path.join(nestedDir, "processed")
                textColor = "grey"
                textId = "nestedTextInfo"


            os.makedirs(processed_dir, exist_ok=True)
            
            # save the text file in processed, then use that text file to convert to mmage
            saveImg = os.path.splitext(item)[0] + "_pr.png"
            processed_path = os.path.join(processed_dir, saveImg)

            saveTextTemp = os.path.splitext(item)[0] + "_temp.txt"
            processedTextForImg = os.path.join(processed_dir, saveTextTemp)

            saveText = os.path.splitext(item)[0] + "_pr.txt"
            processedTextForHTML = os.path.join(processed_dir, saveText)

            # open file, and save content in folder processed under a different name
            with open(item_path, "r") as file:
                content = file.read()

            modified_content = re.sub(r'<iframe\b[^>]*>.*?</iframe>', '', content, flags=re.DOTALL)
            modified_content = f'<span foreground="{textColor}">' + modified_content + "</span>\n"
            modified_content = modified_content.replace("&", "and")

            with open(processedTextForImg, "w") as new_file:
                new_file.write(modified_content)
                print(f'{item} -> temp text for panco image file written')


            with open(processedTextForHTML, "w") as new_file:
                new_file.write(f'<span class="{textId}">' +content + '</span>')
                print(f'{item} -> text file written')

            
            os.system(f'convert -background none -size 512x512 -pointsize 20 -define pango:justify=true pango:@"{processedTextForImg}" "{processed_path}"')
            os.remove(processedTextForImg)
            text.append(processedTextForHTML)
            week.append(processed_path)


def preProcessPdfs(item, week_folder_path, nestedDir=None):
    item_path = os.path.join(week_folder_path, item)   
    if os.path.isfile(item_path):
        if item_path.lower().endswith((".pdf")):
            processed_dir = os.path.join(week_folder_path, "processed")

            optionalArgs = '-transparent white'
            if nestedDir != None:
                print("nested directory -pdf- is activated")
                processed_dir = os.path.join(nestedDir, "processed")
                optionalArgs = "-transparent black"


            os.makedirs(processed_dir, exist_ok=True)
            
            # if not re.search(r"preProcessed", item_path):
            pages = convert_from_path(item_path)
            for i, page in enumerate(pages):
                item_pdf_save_path = os.path.join(week_folder_path, os.path.splitext(item)[0] + f'_{i}')
                page.save(item_pdf_save_path, 'JPEG')
                saveImg = os.path.splitext(item)[0] + "_pr_" + f'{i}.png'
                saveImgAlpha = os.path.splitext(item)[0] + "_pr_" + f'{i}_alpha.png'

                processed_path = os.path.join(processed_dir, saveImg)
                processed_path_alpha = os.path.join(processed_dir, saveImgAlpha)

                pdfToImgColor = f'convert -density 150 "{item_pdf_save_path}" -resize 512x -quality 90 {optionalArgs} "{processed_path}"' 
                pdfToImgAlpha = f'convert -density 150 "{item_pdf_save_path}" -resize 512x -fuzz 15% -quality 90 {optionalArgs} "{processed_path_alpha}"'
            
                subprocess.run(pdfToImgColor, shell=True)
                subprocess.run(pdfToImgAlpha, shell=True)        

                os.remove(item_pdf_save_path)
                images.append("../" + processed_path) #save normal pdfs so it diplays in info
                week.append(processed_path_alpha) #save alpha pdfs so it diplays in three.js
                

def preProcessGifs(item, week_folder_path, nestedDir=None):
    item_path = os.path.join(week_folder_path, item)   
    print(item_path)
    if os.path.isfile(item_path):
        if item.lower().endswith((".gif")):
            processed_dir = os.path.join(week_folder_path, "processed")

            resize_file_if_large(item_path, 1000000) #1mb max, for uploading mainly

            optionalArgs = ''
            if nestedDir != None:
                print("nested directory -gif- is activated")
                processed_dir = os.path.join(nestedDir, "processed")
                optionalArgs = " "

            os.makedirs(processed_dir, exist_ok=True)

            if not re.search(r"preProcessed", item_path):
                gifTempFolder = os.path.join(week_folder_path, "gifTemp")                
                os.mkdir(gifTempFolder)
                tempImgPath = os.path.join(gifTempFolder, os.path.splitext(item)[0] + "_preProcessed")
                
                os.system(f'convert "{item_path}" -coalesce -sharpen 0x1 -resize 512x512!  "{tempImgPath}.png"')
                
                divider = math.ceil(len(os.listdir(gifTempFolder))*0.1)
                # print(divider)
                for i, image in enumerate(natsorted(os.listdir(gifTempFolder))):
                    tempImg = os.path.join(gifTempFolder, image)
                    if i%divider!=0:
                        os.remove(tempImg)

                print(tempImgPath)
                # make sadditional alpha images if tht total is not 10
                nFrames = 10
                additionalImg = (nFrames-len(natsorted(os.listdir(gifTempFolder))))
                if additionalImg !=0:
                    for i in range(0,additionalImg):
                        i = nFrames - i
                        os.system(f'convert -size 512x512 xc:none -alpha transparent "{os.path.join(gifTempFolder, f"zzz_{i}.png")}"')
                
                # rename the files so sorting them wont be an issue
                for i, img in enumerate(natsorted(os.listdir(gifTempFolder))):
                    originalPath = os.path.join(gifTempFolder, img)
                    newPath = os.path.join(gifTempFolder, f'{i}_{img}')
                    os.rename(originalPath, newPath)

                processed_path = os.path.join(processed_dir, f'{item}_preProcessed_long_.png')
                os.system(f'convert "{os.path.join(gifTempFolder, "*.png")}" -resize 512x512 -fuzz 10% -transparent black -fuzz 10% -transparent DimGray -append {optionalArgs} "{processed_path}"')

                #  make the gif resize and save it
                processed_path_gif = os.path.join(processed_dir, f'{item}_preProcessed.gif')
                os.system(f'convert "{item_path}" -coalesce -resize 512x -colors 32 -deconstruct -loop 0  {optionalArgs} "{processed_path_gif}"')


                images.append("../" + processed_path_gif) #save normal pdfs so it diplays in info
                week.append(processed_path) #save alpha pdfs so it diplays in three.js

                # remove tempfolder with content
                shutil.rmtree(gifTempFolder)


def generate_html_file(filename, title, groupContent, weeks, content, images, group):
    with open(filename, 'w') as file:
        file.write("<!DOCTYPE html>\n")
        file.write("<html>\n")
        file.write("<head>\n")
        file.write(f"<title>{title}</title>\n")
        file.write("<link rel='stylesheet' href='../style.css'>\n")
        file.write("</head>\n")
        file.write("<body id='groupDescription'>\n")
        file.write(f"<h1>{title}</h1>\n")


        text_content = group


        # Check if content folder contains a ".txt" file
        if groupContent != False:
            for content in os.listdir(groupContent):
                file_path = os.path.join(groupContent, content)
                if os.path.isfile(file_path):
                    file_name, file_extension = os.path.splitext(content)
                    if file_extension.strip().lower() == ".txt":
                        with open(file_path, 'r') as groupFile:
                            text_content = groupFile.read()
                            
        
        
        file.write(f"<p>{text_content}</p>\n")

        for week, week_content, week_images in zip(weeks, content, images):
            file.write(f"<h2>{week}</h2>\n")
            
            # Text content
            file.write("<div>\n")
            for text_item in week_content:
                with open(text_item, 'r') as text_file:
                    content = text_file.read().replace('\n', '<br>')     
                    file.write(f"<p>{content}</p>\n")
            file.write("</div>\n")
            
            # Images
            for image_item in week_images:
                file.write(f"<img onclick='enlargeImage(this)' src='{image_item}' alt='Image'>\n")
                # file.write(f"<img src='{image_item}' alt='Image'>\n")

        file.write("<script>function enlargeImage(img) {  if (img.style.width === '100%') { img.style.width = '100px'; } else { img.style.width = '100%'; }}</script>\n")
        file.write("</body>\n")
        file.write("</html>")

    # print(f"HTML file '{filename}' generated and saved successfully.")

# if folder descriptions exists, delete the content first
info = "info"

if os.path.exists(info):
    # Folder exists, delete its contents
    file_list = os.listdir(info)
    for file_name in file_list:
        file_path = os.path.join(info, file_name)
        if os.path.isfile(file_path):
            os.remove(file_path)
else:
    os.makedirs(info)


additional_folder_path = "extra"
# Check if the additionalData folder exists

if os.path.exists(additional_folder_path):
    # Remove all files inside the folder
    file_list = os.listdir(additional_folder_path)
    for file_name in file_list:
        file_path = os.path.join(additional_folder_path, file_name)
        os.remove(file_path)
else:
    # Create the additionalData folder
    os.makedirs(additional_folder_path)


groups = {}
groups["theCityAndtheCity"] = {} #make the full theCityAndtheCity
weeksHTML = {}



def check_folder_for_txt_file(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            file_name, file_extension = os.path.splitext(filename)
            if file_extension.strip().lower() == ".txt":
                with open(file_path, 'r') as file:
                    content = file.read()
                return content
    return None


# Loop over every folder in "content"
for group in sorted(os.listdir("content")):
    group_path = os.path.join("content", group)

    if os.path.isdir(group_path):
        groups[group] = {}

        # Loop over every folder inside
        for student in natsorted(os.listdir(group_path)):
            student_path = os.path.join(group_path, student)

            content = check_folder_for_txt_file(group_path)
            if content:
                generate_html_file(f"info/{group.replace(' ', '_')}.html", group.replace(' ', '_'), group_path , [],[],[], f"no data available. please adda a text file: {group_path}")
                print(f"succesfully generated {group} description file")
            else:
                # print(f"The {group} does not contain a '.txt' file.")
                generate_html_file(f"info/{group.replace(' ', '_')}.html", group.replace(' ', '_'), group_path , [],[],[], f"no data available. please adda a text file: {group_path}")
                print(f"succesfully generated {group} from non exist description file")

            if os.path.isdir(student_path):

                weeks = []
                textArray = []
                imgArray = []
                weekArray = []

                # Loop over every folder inside the student folder
                for week_folder in sorted(os.listdir(student_path)):
                    weekArray.append(week_folder)
                    week_folder_path = os.path.join(student_path, week_folder)
                    if os.path.isdir(week_folder_path) and week_folder != "processed":

                        week = []
                        text = []
                        images = []
                      
                        # Delete the "processed" folder and its content if it exists
                        processed_dir = os.path.join(week_folder_path, "processed")
                        if os.path.exists(processed_dir):
                            shutil.rmtree(processed_dir)


                        for item in sorted(os.listdir(week_folder_path)):  
                            item_path = os.path.join(week_folder_path, item)  
                            if os.path.isdir(item_path) and item != "processed":

                                os.system(f"""convert -background none -size 256x256 -pointsize 20 -define pango:justify=true  pango:"<span foreground=\\"white\\"> {week_folder}</span> " ./{additional_folder_path}/{week_folder}.png""")
                                week.append(f'./{additional_folder_path}/{week_folder}.png')

                                
                                for sub_item in natsorted(os.listdir(item_path)):
                                    sub_item_path = os.path.join(item_path, sub_item)

                                    preProcessPdfs(sub_item, item_path, week_folder_path)
                                    preProcessGifs(sub_item, item_path, week_folder_path)
                                    preProcessImages(sub_item, item_path, week_folder_path)
                                    preProcessText(sub_item, item_path, week_folder_path)
                                    remove_unsupported_file(os.path.join(item_path, sub_item))



                        os.system(f"""convert -background none -size 256x256 -pointsize 20 -define pango:justify=true  pango:"<span foreground=\\"white\\">ref: {week_folder}</span> " ./{additional_folder_path}/foo_{week_folder}.png""")
                        week.append(f'./{additional_folder_path}/foo_{week_folder}.png')
                        
                        
                        for item in natsorted(os.listdir(week_folder_path)):
    

                            preProcessPdfs(item, week_folder_path)
                            preProcessGifs(item, week_folder_path)
                            preProcessImages(item, week_folder_path)
                            preProcessText(item, week_folder_path)
                            remove_unsupported_file(os.path.join(week_folder_path, item))

                            
                        textArray.append(text)
                        imgArray.append(images)
    

                        os.system(f"""convert -background none -size 512x512 -pointsize 20 -define pango:justify=true  pango:"<span foreground=\\"white\\">content: {week_folder}</span> " ./{additional_folder_path}/ref_{week_folder}.png""")
                        week.append(f'./{additional_folder_path}/ref_{week_folder}.png')
                        weeks.append(week)

                all_content = [item for sublist in weeks for item in sublist]  # Flatten the week lists
                groups[group][student] = all_content

                # create theCityAndtheCity dict
                groups["theCityAndtheCity"][student] = all_content
                # generate html files for students
                generate_html_file(f"info/{student.replace(' ', '_')}.html", student.replace(' ', '_'), False, weekArray, textArray, imgArray, group)


# Generate the JavaScript object and Write the JavaScript object to a file
js_object = json.dumps(groups, indent=4)
with open("data.js", "w") as file:
    file.write("var groups = ")
    file.write(js_object)

print("Data written to data.js successfully.")



