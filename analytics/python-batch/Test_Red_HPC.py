import cv2
import numpy as np
import os
import sys

# Test 1 - Min Area + CF ------- Higher Threshold ----------------
#file_path = os.listdir(sys.argv[1])
red_test = open('Red_Test.txt', 'w')
red_test.write("Image\t# Of Cells\tTotal Cell Area\tTissue Area\tNormalized(Cell/Tissue)\n")
img = cv2.imread(sys.argv[1])
print sys.argv[1]
b,g,r = cv2.split(img)
rg = cv2.merge([r,g,b])
rg = rg.astype(np.float32)

np.seterr(all = 'ignore')
mask = np.empty_like(rg)
arr_max = rg.max(-1)
delta = rg.ptp(-1)
s = delta/arr_max
s[delta==0]=0
idx = (rg[:,:,0] == arr_max)
mask[idx,0] = np.true_divide((rg[idx,1] - rg[idx,2]), delta[idx])
idx = (rg[:,:,1] == arr_max)
mask[idx,0] = 2. + np.true_divide((rg[idx,2] - rg[idx,0]), delta[idx])
idx = (rg[:,:,2] == arr_max)
mask[idx,0] = 4. + np.true_divide((rg[idx,0] - rg[idx,1]), delta[idx])
mask[:,:,0] = ((mask[:,:,0]/6.0)%1.0)*255.0
mask[:,:,0] = np.nan_to_num(mask[:,:,0])
mask[:,:,1] = s * 255.0
mask[:,:,2] = arr_max
mask = mask.astype(np.uint8)

nuclei_points = cv2.inRange(mask, (200, 150, 0), (255,255,195))
im, contours, hierarchy = cv2.findContours(nuclei_points, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
cells = []
cell_area = 0
t1 = np.zeros(nuclei_points.shape, np.uint8)
for cnt in contours:
	area = cv2.contourArea(cnt)
        true_area = cv2.contourArea(cnt, True)
        perimeter = cv2.arcLength(cnt, True)
        if (perimeter != 0.0):
        	circularity_factor = (4*np.pi*area)/(perimeter*perimeter)
                if area >= 500 and area < 10000 and circularity_factor >= 0.1:
                	cells.append(cnt)
                        cv2.drawContours(t1, [cnt],0,255,-1)
                        cell_area += area

tissue = cv2.inRange(mask, (0,30,0), (255,255,255))
im, tissue_cnt, h = cv2.findContours(tissue, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
tissue_area = 0
for c in tissue_cnt:
        tissue_area += cv2.contourArea(c)
        if tissue_area == 0:
          answ = 0
        else:
          answ = cell_area/tissue_area
       
red_test.write(sys.argv[1]+'\t'+str(len(cells))+'\t'+str(cell_area)+'\t'+str(tissue_area)+'\t'+str(answ)+'\n')
red_test.close()
