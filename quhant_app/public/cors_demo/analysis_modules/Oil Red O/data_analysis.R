# Command line syntax
# Follow the https://google.github.io/styleguide/Rguide.xml style guide
# R < data_analysis.R --no-save

error.bar <- function(x, y, upper, lower=upper, length=0.1,...){
  # Plot error bars on graphs
  # 
  #    errorbar (x, y, upper, lower=upper, length=0.1, sides="both", ...)
  #
  #    x       = x values
  #    y       = y values
  #    upper   = upper part of error bars
  #    lower   = lower part of error bars
  #    length  = length of bars
  #    sides   = "both" else only upper
  #    abs.val = direction of arrow (see ?arrow) 
  #
  # Author: Tarik C. Gouhier
  # Last modified: September 8, 2016 (Rance Nault)
  # http://www.northeastern.edu/synchrony/stats/errorbar.R
  if(length(x)     != length(y) | 
     length(y)     !=length(lower) | 
     length(lower) != length(upper)) {
    stop('vectors must be same length')
  }
  arrows(x,y+upper,x,y, angle=90, code=3, length=length, ...)
}

shape.data <- function(matr, variable1, variable2, name) {
  # Shape the data for export and plotting in bar graph
  # 
  #    shape.data (matr, rows, columns, variable1, variable2, name)
  #
  #    matr       = matrix generated using tapply with 2 factors
  #    rows       = matrix row names
  #    columns    = matrix column name
  #    Variable1  = Name of first variable
  #    Variable2  = Name of second variable
  #    name   	  = name of measurement type
  #
  # Author: Rance Nault
  # Last modified: September 8, 2016
    mat <- matr
	mat[is.na(mat)] <- 0
	newMat<-matrix(ncol=3,nrow=(dim(matr)[1] * dim(matr)[2]))
	k=0
	for (i in 1:dim(matr)[1]) {
	  for (j in 1:dim(matr)[2]) {
	    k=k+1
	    nrow<-c(rownames(matr)[i],colnames(matr)[j],as.numeric(matr[i,j]))
		newMat[k,1] <- rownames(matr)[i]
		newMat[k,2] <- colnames(matr)[j]
		newMat[k,3] <- matr[i,j]
	  }
	} 
	colnames(newMat) <- c(variable1, variable2, name)
	mat <- newMat
	return(mat)
}

############################# START SCRIPT HERE ###############################

setwd('.')
flag <- TRUE

# Import Tables
tryCatch({
  features.summary <- unique(read.table('results_summary.csv', sep=',', header=TRUE))
  features.full <- unique(read.table('results_full.csv', sep=',', header=TRUE))

  background.summary <- unique(read.table('results_summary_background.csv', sep=',', header=TRUE))
  background.full <- unique(read.table('results_full_background.csv', sep=',', header=TRUE))
}, error=function(e){flag <<- FALSE})

tryCatch({
  metadata <- unique(read.table('results_metadata.csv', sep=',', header=TRUE))
  }, error=function(e){flag <<- FALSE})

# Standard Feature Measurements
features.summary.set_sum <- with(features.summary, tapply(features.summary[,'Total.Area'], list(features.summary[,'Set']),sum))
#features.summary.set_ave <- with(features.summary, tapply(features.summary[,'Total.Area'], list(features.summary[,'Set']),mean))
features.summary.proj_sum <- with(features.summary, tapply(features.summary[,'Total.Area'], list(features.summary[,'Project']),sum))
#features.summary.proj_ave <- with(features.summary, tapply(features.summary[,'Total.Area'], list(features.summary[,'Project']),mean))

background.summary.set_sum <- with(background.summary, tapply(background.summary[,'Total.Area'], list(background.summary[,'Set']),sum))
background.summary.proj_sum <- with(background.summary, tapply(background.summary[,'Total.Area'], list(background.summary[,'Project']),sum))

if (dim(features.summary.set_sum)==dim(background.summary.set_sum)){
  set.area <- features.summary.set_sum/background.summary.set_sum
  png('AreabySet.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
    barplot(set.area, ylab='Volume Density (%)', xlab='Sets', main='Sum of Areas by Set')
  dev.off()
} else {
  png('errorim-set.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
    plot(c(0, 1), c(0, 1), ann = F, bty = 'n', type = 'n', xaxt = 'n', yaxt = 'n')
    text(x = 0.5, y = 0.5, paste("There was an error with the data. Please contact quhant@gmail.com"), cex = 1.6, col = "black")
  dev.off()  
  flag=FALSE
}

if (dim(features.summary.proj_sum)==dim(background.summary.proj_sum)){
  project.area <- features.summary.proj_sum/background.summary.proj_sum
  png('AreabyProject.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
    barplot(project.area, ylab='Volume Density (%)', xlab='Sets', main='Sum of Areas by Project')
  dev.off()
} else {
  png('errorim-proj.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
    plot(c(0, 1), c(0, 1), ann = F, bty = 'n', type = 'n', xaxt = 'n', yaxt = 'n')
    text(x = 0.5, y = 0.5, paste("There was an error with the data. Please contact quhant@gmail.com"), cex = 1.6, col = "black")
  dev.off()
  flag=FALSE
}

tryCatch({
if(flag) {
  # Append metadata to data file
  annotated.summary <- merge(features.summary, metadata, 
                             by.x=c('File','Set','Project'),
       					     by.y=c('File','Set','Project'))
  annotated.background <- merge(background.summary, metadata,
                          by.x=c('File','Set','Project'),
	  					  by.y=c('File','Set','Project'))

  # Metadata Measurements
  individual.sum <- data.frame(with(annotated.summary, tapply(annotated.summary[,'Total.Area'], list(annotated.summary$File, annotated.summary$Project, annotated.summary$Set),sum)))
  individual.sum <- cbind(row.names(individual.sum),individual.sum)
  colnames(individual.sum)[1]<-c('IndividualID')
  temp<-reshape(individual.sum, direction="long",varying=list(names(individual.sum)[2:length(individual.sum)]),v.names="Vv",idvar="IndividualId",timevar="projset")
  temp$projset<-colnames(individual.sum)[temp$projset+1]
  individual.sum<-cbind(temp, data.frame(do.call('rbind', strsplit(as.character(temp$projset),'.',fixed=TRUE))))
  colnames(individual.sum)<-c('IndividualID','temp','feat.area','temp2','Project','Set')
  drops=c('temp','temp2')
  individual.sum<-individual.sum[,!(names(individual.sum) %in% drops)]
  bckg.individual.sum <- data.frame(with(annotated.background, tapply(annotated.background[,'Total.Area'], list(annotated.background$File, annotated.background$Project, annotated.background$Set),sum)))
  bckg.individual.sum <- cbind(row.names(bckg.individual.sum),bckg.individual.sum)
  colnames(bckg.individual.sum)[1]<-c('IndividualID')
  temp<-reshape(bckg.individual.sum, direction="long",varying=list(names(bckg.individual.sum)[2:length(bckg.individual.sum)]),v.names="Vv",idvar="IndividualId",timevar="projset")
  temp$projset<-colnames(bckg.individual.sum)[temp$projset+1]
  bckg.individual.sum<-cbind(temp, data.frame(do.call('rbind', strsplit(as.character(temp$projset),'.',fixed=TRUE))))
  colnames(bckg.individual.sum)<-c('IndividualID','temp','bckg.area','temp2','Project','Set')
  drops=c('temp','temp2')
  bckg.individual.sum<-bckg.individual.sum[,!(names(bckg.individual.sum) %in% drops)]
  
  calc.frame <- merge(individual.sum, bckg.individual.sum, by.x=c('IndividualID','Project','Set'),by.y=c('IndividualID','Project','Set'))
  calc.frame[,length(calc.frame)+1]<-(calc.frame$feat.area/calc.frame$bckg.area)*100
  colnames(calc.frame)[length(calc.frame)] <- c('Vv')
  calc.frame<-merge(calc.frame, metadata, by.y=c('Project','Set','IndividualID'),by.x=c('Project','Set','IndividualID'))
  drops=c('File')
  calc.frame<-unique(calc.frame[,!(names(calc.frame) %in% drops)])
  
  if (length(t(calc.frame))>0) {
    png('byIndividual.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
      barp<-barplot(calc.frame$Vv, ylab='Volume Density (%)', xlab='IndividualID', main='ByIndividual', names=calc.frame$IndividualID)
    dev.off()
    write.table(calc.frame, file='byIndividual.csv', sep=',', quote=F, col.names=NA)
    #project.id <- with(calc.frame, tapply(calc.frame$Vv, list(calc.frame$IndividualID),mean))
    #set.id <- with(calc.frame, tapply(calc.frame$Vv, list(calc.frame$IndividualID),mean))
  }

  # For each metadata variable by project and set
  if((length(colnames(metadata))) >= 5) {
    for(ind in 5:length(colnames(metadata))) {
      imName<-paste(colnames(metadata)[ind],'jpeg',sep='_byProjSet.')
      imNameTxt<-paste(colnames(metadata)[ind],'csv',sep='.')
      print(imName)
      independent <- colnames(metadata)[ind]
      feat.avg    <- data.frame(with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent], calc.frame$Project, calc.frame$Set),mean)))
      feat.avg[is.na(feat.avg)] <- 0
      temp<-reshape(feat.avg, direction="long",varying=list(names(feat.avg)[1:length(feat.avg)]), idvar=independent, timevar='projset')
      temp$projset<-colnames(feat.avg)[temp$projset]
      temp[,independent]<-rownames(feat.avg)[temp[,independent]]
      feat.avg<-temp
      feat.sd     <- data.frame(with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent], calc.frame$Project, calc.frame$Set),sd)))
      feat.sd[is.na(feat.sd)] <- 0
      
      temp<-reshape(feat.sd, direction="long",varying=list(names(feat.sd)[1:length(feat.sd)]), idvar=independent, timevar='projset')
      temp$projset<-colnames(feat.sd)[temp$projset]
      temp[,independent]<-rownames(feat.sd)[temp[,independent]]
      feat.sd<-temp
      
      feat.count  <- data.frame(with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent], calc.frame$Project, calc.frame$Set),function(x) length(unique(x)))))
      feat.count[is.na(feat.count)] <- 0
      
      temp<-reshape(feat.count, direction="long",varying=list(names(feat.count)[1:length(feat.count)]), idvar=independent, timevar='projset')
      temp$projset<-colnames(feat.count)[temp$projset]
      temp[,independent]<-rownames(feat.count)[temp[,independent]]
      feat.count<-temp
      
      feat.sem    <- feat.sd[,2]/sqrt(feat.count[,2])
      feat.sem[is.na(feat.sem)] <- 0
      
      NewTable    <- cbind(feat.avg, feat.sd[,2], feat.count[,2], feat.sem)
      colnames(NewTable)<-c('projset','Vv',independent,'sd','count','sem')
      write.table(NewTable, file=imNameTxt, sep=',', quote=F, col.names=NA)
      png(imName, type='cairo', res=600, width = 11000, height=3000, pointsize=6)
        barp<-barplot(feat.avg[,2], ylab='Area', xlab=imName, ylim=c(0,max(feat.avg[,2])+max(feat.sem)), main=imName,names=paste(feat.avg[,1],feat.avg[,3]))
        error.bar(barp,feat.avg[,2],feat.sem)
      dev.off()
    }
  }
    
  # For each metadata variable
  if((length(colnames(metadata))) >= 5) {
    for(ind in 5:length(colnames(metadata))) {
      imName<-paste(colnames(metadata)[ind],'jpeg',sep='.')
      imNameTxt<-paste(colnames(metadata)[ind],'csv',sep='.')
      print(imName)
      independent <- colnames(metadata)[ind]
      feat.avg    <- with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent]),mean))
      feat.avg[is.na(feat.avg)] <- 0
      feat.sd     <- with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent]),sd))
      feat.sd[is.na(feat.sd)] <- 0
      feat.count  <- with(calc.frame, tapply(calc.frame$Vv, list(calc.frame[,independent]),function(x) length(unique(x))))
      feat.count[is.na(feat.count)] <- 0
      feat.sem    <- feat.sd/sqrt(feat.count)
      feat.sem[is.na(feat.sem)] <- 0
      NewTable    <- rbind(feat.avg, feat.sd, feat.count, feat.sem)
      write.table(NewTable, file=imNameTxt, sep=',', quote=F, col.names=NA)
      png(imName, type='cairo', res=600, width = 6000, height=3000, pointsize=10)
        barp<-barplot(feat.avg, ylab='Area', xlab=imName, ylim=c(0,max(feat.avg)+max(feat.sem)), main=imName)
        error.bar(barp,feat.avg,feat.sem)
      dev.off()
    }
    }
  
  
  # For combination of metadata variables
#   if((length(colnames(metadata))) >= 6) {
#     metadata.size <- c(5:length(colnames(metadata))) 
#     combo<-combn(metadata.size,2)
#     for(ind2 in 1:(length(combo)/2)) {
#       var1<-colnames(metadata)[combo[1,ind2]]
#       var2<-colnames(metadata)[combo[2,ind2]]
#       tempName<-paste(var1, var2, sep='-')
#       imName<-paste(tempName,'jpeg',sep='.')
#       imNameTxt<-paste(tempName,'csv',sep='.')
# 
#       independent1<-colnames(metadata)[combo[1,ind2]]
#       independent2<-colnames(metadata)[combo[2,ind2]]
# 
#       avg<-with(individual.sum, tapply(individual.sum[,'Total.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),mean))
#       feat.avg <- data.frame(avg)
#       feat.sd <- data.frame(with(individual.sum, tapply(individual.sum[,'Total.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),sd)))
#       feat.count <- data.frame(with(individual.sum, tapply(individual.sum[,'Total.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),function(x) length(unique(x)))))
#       feat.sem<-data.frame(feat.sd/sqrt(feat.count))
# 
#       feat.avg <- shape.data(feat.avg, var1, var2, 'Average')
#       feat.sd <- shape.data(feat.sd, var1, var2, 'SD')
#       feat.count <- shape.data(feat.count, var1, var2, 'Count')
#       feat.sem <- shape.data(feat.sem, var1, var2, 'SEM')
#    
#       NewTable <- cbind(feat.avg, feat.sd[,"SD"], feat.count[,"Count"], feat.sem[,"SEM"])
# 	  colnames(NewTable) <- c(var1,var2,'Average','SD','Count','SEM')
#       write.table(NewTable, file=imNameTxt, sep=',', quote=F, col.names=NA)
#   
#       png(imName, type='cairo', res=600, width = 6000, height=3000, pointsize=10)
#         barp <- barplot(avg, 
#   	                    beside=T, 
# 			   	        ylab='Area', 
# 				        ylim=c(0,max(as.numeric(as.vector(feat.avg[,'Average'])))+max(as.numeric(as.vector(feat.sem[,'SEM'])))),
# 				        xlab=var2, 
# 				        main=imName, 
# 				        legend = unique(as.vector(feat.avg[,var1])))
#         error.bar(barp,as.numeric(as.vector(t(feat.avg[,'Average']))),as.numeric(as.vector(t(feat.sem[,'SEM'])))) 
#       dev.off()
#     }
#   }
}
}, error=function(e){flag <<- FALSE})

if(!flag) {
  png('errorim.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
    plot(c(0, 1), c(0, 1), ann = F, bty = 'n', type = 'n', xaxt = 'n', yaxt = 'n')
    text(x = 0.5, y = 0.5, paste("There was an error with the data. Please contact quhant@gmail.com"), cex = 1.6, col = "black")
  dev.off()
}
