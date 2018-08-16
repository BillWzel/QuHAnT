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
###############################################################################
############################# START SCRIPT HERE ###############################
###############################################################################

setwd('.')
flag <- TRUE

# Import Tables
features.summary <- read.csv('results_summary.csv')
#features.full <- read.table('results_full.csv', sep=',', header=TRUE)

tryCatch({
  metadata <- read.csv('metadata.csv')
  }, error=function(e){flag <<- FALSE})

# Standard Feature Measurements
features.summary.set_sum <- with(features.summary, tapply(features.summary[,'Total.Cell.Area'], list(features.summary[,'Set']),sum))
features.summary.set_ave <- with(features.summary, tapply(features.summary[,'Total.Cell.Area'], list(features.summary[,'Set']),mean))
features.summary.proj_sum <- with(features.summary, tapply(features.summary[,'Total.Cell.Area'], list(features.summary[,'Project']),sum))
features.summary.proj_ave <- with(features.summary, tapply(features.summary[,'Total.Cell.Area'], list(features.summary[,'Project']),mean))

#features.full.image_sum <- with(features.full, tapply(features.full[,'Area'], list(features.full[,'File']), sum))
#features.full.image_ave <- with(features.full, tapply(features.full[,'Area'], list(features.full[,'File']), mean))
#features.full.image_no_feat <- with(features.full, tapply(features.full[,'Area'], list(features.full[,'File']),function(x) length(unique(x))))

# Save Graphs
png('summ_set_sum.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
  barplot(features.summary.set_sum, ylab='Area', xlab='Sets', main='Sum of Areas Within Sets')
dev.off()

png('summ_set_ave.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
  barplot(features.summary.set_ave, ylab='Area', xlab='Sets', main='Average of Areas Within Sets')
dev.off()

png('summ_proj_sum.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
  barplot(features.summary.proj_sum, ylab='Area', xlab='Projects', main='Sum of Areas Within Projects')
dev.off()

png('summ_proj_ave.jpeg', type='cairo', res=600, width = 6000, height=3000, pointsize=10)
  barplot(features.summary.proj_ave, ylab='Area', xlab='Projects', main='Average of Areas Within Projects')
dev.off()

#png('full_image_sum.jpeg', type='cairo', res=600, width=6000, height=3000, pointsize=10)
#  barplot(features.full.image_sum, ylab='Area', xlab='Images', main='Sum of Area Within Images')
#dev.off()

#png('full_image_ave.jpeg', type='cairo', res=600, width=6000, height=3000, pointsize=10)
#  barplot(features.full.image_ave, ylab='Area', xlab='Images', main='Average of Area Within Images')
#dev.off()

#png('full_image_no_feat.jpeg', type='cairo', res=600, width=6000, height=3000, pointsize=10)
#  barplot(features.full.image_no_feat, ylab='No. of Features', xlab='Images', main='Number of Features Within Images')
#dev.off()
  
  
 if(flag) {
  # Append metadata to data file
  annotated.summary <- merge(features.summary, metadata, 
                             by.x=c('File','Set','Project'),
       					     by.y=c('File','Set','Project'))
#  annotated.full <- merge(features.full, metadata,
#                          by.x=c('File','Set','Project'),
#	  					  by.y=c('File','Set','Project'))



  # Metadata Measurements
  individual.sum <- data.frame(with(annotated.summary, tapply(annotated.summary[,'Total.Cell.Area'], list(annotated.summary[,'IndividualID']),sum)))
  individual.sum <- cbind(row.names(individual.sum),individual.sum)
  colnames(individual.sum)<-c('IndividualID','Total.Cell.Area')
  individual.sum<-merge(individual.sum, metadata, by.x=c('IndividualID'),by.y=c('IndividualID'))
  individual.sum[,'Total.Cell.Area']<-as.numeric(individual.sum[,'Total.Cell.Area'])

  # For each metadata variable
  if((length(colnames(metadata))) >= 5) {
    for(ind in 5:length(colnames(metadata))) {
      imName<-paste(colnames(metadata)[ind],'jpeg',sep='.')
      imNameTxt<-paste(colnames(metadata)[ind],'csv',sep='.')
      print(imName)
      independent <- colnames(metadata)[ind]
      feat.avg    <- with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent]),mean))
      feat.avg[is.na(feat.avg)] <- 0
      feat.sd     <- with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent]),sd))
      feat.sd[is.na(feat.sd)] <- 0
      feat.count  <- with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent]),function(x) length(unique(x))))
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
  if((length(colnames(metadata))) >= 6) {
    metadata.size <- c(5:length(colnames(metadata))) 
    combo<-combn(metadata.size,2)
    for(ind2 in 1:(length(combo)/2)) {
      var1<-colnames(metadata)[combo[1,ind2]]
      var2<-colnames(metadata)[combo[2,ind2]]
      tempName<-paste(var1, var2, sep='-')
      imName<-paste(tempName,'jpeg',sep='.')
      imNameTxt<-paste(tempName,'csv',sep='.')

      independent1<-colnames(metadata)[combo[1,ind2]]
      independent2<-colnames(metadata)[combo[2,ind2]]

      avg<-with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),mean))
      feat.avg <- data.frame(avg)
      feat.sd <- data.frame(with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),sd)))
      feat.count <- data.frame(with(individual.sum, tapply(individual.sum[,'Total.Cell.Area'], list(individual.sum[,independent1],individual.sum[,independent2]),function(x) length(unique(x)))))
      feat.sem<-data.frame(feat.sd/sqrt(feat.count))

      feat.avg <- shape.data(feat.avg, var1, var2, 'Average')
      feat.sd <- shape.data(feat.sd, var1, var2, 'SD')
      feat.count <- shape.data(feat.count, var1, var2, 'Count')
      feat.sem <- shape.data(feat.sem, var1, var2, 'SEM')
   
      NewTable <- cbind(feat.avg, feat.sd[,"SD"], feat.count[,"Count"], feat.sem[,"SEM"])
	  colnames(NewTable) <- c(var1,var2,'Average','SD','Count','SEM')
      write.table(NewTable, file=imNameTxt, sep=',', quote=F, col.names=NA)
  
      png(imName, type='cairo', res=600, width = 6000, height=3000, pointsize=10)
        barp <- barplot(avg, 
  	                    beside=T, 
			   	        ylab='Area', 
				        ylim=c(0,max(as.numeric(as.vector(feat.avg[,'Average'])))+max(as.numeric(as.vector(feat.sem[,'SEM'])))),
				        xlab=var2, 
				        main=imName, 
				        legend = unique(as.vector(feat.avg[,var1])))
        error.bar(barp,as.numeric(as.vector(t(feat.avg[,'Average']))),as.numeric(as.vector(t(feat.sem[,'SEM'])))) 
      dev.off()
    }
  }
}
