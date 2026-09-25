---
tags: "blog"
title: Books Books Books
date: "2018-10-20T16:22:20Z"
timestamp: "1540052540"
description: GoodReads API, Google Sheets API, Node, and me.
featuredImage:
  src: https://images.unsplash.com/photo-1524995997946-a1c2e315a42f
  credit: Susan Q Yin
  url: https://unsplash.com/@syinq
  alt: Books in a library
---

I read a lot. I've been trying to read some spooky books this Halloween season. You can check out the books I'm reading on my [GoodReads profile](https://www.goodreads.com/user/show/1665822-rob-lindsey). And when I launched this new site, I knew I wanted to include a simple page of recent [books I've been reading](/books) (inspired once more by the good [Mr. Rupert](https://daverupert.com/bookshelf)).

GoodReads can be cumbersome to navigate, and it's slow. I thought having a quick, glanceable page of book covers would be nice.

I knew GoodReads had an API, but when I started exploring it, I realized it wouldn't work easily for what I was trying to do.

It spits out XML, and the filtering options aren't super robust. I have like 500+ books on my "read" shelf, and I didn't want all of them on a simple books page. I decided to export my shelf to a CSV file and create a Google Sheet for the last three years of books.

Keeping my books lists in a Google Sheet let me more easily manage which ISBN the books would have (GoodReads isn't super transparent about which edition you've added to your shelf). It would also allow me to easily split the books into sheets by year.

The Google Sheets API is the polar opposite in terms of functionality and complexity. It was fairly easy to get up and running and query the spreadsheet data. I started building a little Node script that would spit out the spreadsheet data into JSON. At first, I just piped console.log output into a .json file.

```bash
node books.js > books.json
```

This worked, but it was super janky. First, I still had to manually update the Google Sheet every time I finished a book on GoodReads. Then I had to run that silly command to build the file. I wanted to be able to do it all in one go. The promise of computers! ([Here's the code](https://github.com/clubrob/roblindsey.com/blob/master/automate/books.js) for what I came up with if you're into spoilers.)

My desired workflow:

1. Get data from GoodReads API
2. Convert data from XML to JSON
3. Append data to spreadsheet through Google Sheets API
4. Sort spreadsheet data to reverse chronological
5. Get spreadsheet data from Google Sheets API
6. Write JSON file to be used in my Eleventy build process

This is a command line Node script. Here are the dependencies I used:

- [`request-promise`](https://www.npmjs.com/package/request-promise) node package to return a chainable promise from the GoodReads API so it was easier to handle the async response.
- [`xml-js`](https://www.npmjs.com/package/xml-js) package to handle the XML>JSON conversion, and it worked as documented.
- [`dayjs`](https://www.npmjs.com/package/dayjs) is a moment alternative that is smaller and faster. I wasn't doing any crazy date manipulations, and dayjs did the trick.
- The `fs` and `readline` default Node packages for reading/writing files.
- And the `googleapis` package to communicate with the Sheets API.

The first issue I had was how to determine which books from GoodReads I needed to append to the sheet. Essentially, which books have I read since the last time I updated the spreadsheet? So I wrote a simple function that pulls the date from the first item in my existing `books.json` file and converts it to a new `Date` object. Then I compared that date to the dates from the GoodReads response and only returned an array of ones that are newer. To get that to work as expected, I also had to "round down" the GoodReads date to the day instead of the millisecond. Dayjs was perfect for this back and forth.

Function to get the date of last book read from the books.json file:

```javascript
function getLastDateRead() {
	let booksJSON = require("../src/_data/books.json");
	let dateRead = dayjs(booksJSON.read[0].books[0].dateRead).format(
		"YYYY/MM/DD",
	);
	return new Date(dateRead);
}
```

Filter function that compares the dates of each item of an array:

```javascript
function filterByDate(item) {
	let dateRead = dayjs(item.read_at._text).format("YYYY/MM/DD");
	let dateReadRounded = new Date(dateRead);
	return lastDate < dateReadRounded;
}
```

With that done, I just had to learn how to update a Google Sheet through the API: append rows, sort data, get data. I'm sure there is a more elegant way to accomplish this than what I wound up with, but there are not a ton of fully written examples in the [Sheets API documentation](https://developers.google.com/sheets/api/) to give much guidance.

I think I could do a `spreadsheets.batchUpdate` that includes each of these steps, but because there weren't any examples of such a thing, I opted to chain the promises in a row.

So I've got `appendToSheet()`, which uses the simple `spreadsheets.values.append` method. Then `sortSheet()`, which uses `spreadsheets.batchUpdate` and the `sortRange` request. And finally `getSheetValues()`, which uses the simple `spreadsheets.values.batchGet` method (`batchGet` because I'm querying three sheet ranges from one spreadsheet).

The last step is to write the updated `books.json` file. I chose to convert the spreadsheet data into JSON and write the file in the same `writeBooksJSON()` function because the conversion is just a couple of array maps into a `JSON.stringify`. Then I used a simple Node `fs` write operation to create the file. Works like a charm.

You could say I did all this so I could type `node books.js` instead of `node books.js > books.json`, but I like to think it's more than that. I learned a lot about APIs and promises. I learned what it takes to marry an old-school API like GoodReads to an ultra-modern API like Google Sheets.

And I got a blog post out of it. 😉
