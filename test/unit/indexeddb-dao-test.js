module("IndexedDB DAO");

var idbDao_test = {};

// init dependencies
idbDao_test.idb = new app.dao.IndexedDbDAO(window);
idbDao_test.testMails = new TestData().getEmailCollection(10).toJSON();

asyncTest("Clear", 1, function() {
	idbDao_test.idb.clear(function(err) {
		ok(!err, 'init');

		start();
	});
});

asyncTest("Init", 1, function() {
	idbDao_test.idb.init(function(err) {
		ok(!err, 'init');

		start();
	});
});

asyncTest("Put", 3, function() {
	var mail1 = idbDao_test.testMails[0];
	var mail2 = idbDao_test.testMails[1];
	var mail3 = idbDao_test.testMails[2];

	idbDao_test.idb.put('email', mail2, function(err) {
		ok(!err, 'put 2');

		idbDao_test.idb.put('email', mail1, function(err) {
			ok(!err, 'put 1');


			idbDao_test.idb.put('email', mail3, function(err) {
				ok(!err, 'put 3');

				start();
			});
		});
	});
});

asyncTest("Find", 2, function() {
	var mail1 = idbDao_test.testMails[0];

	idbDao_test.idb.find('email', {subject: mail1.subject}, function(err, res) {
		ok(!err, 'read');
		deepEqual(res, mail1);

		start();
	});
});

asyncTest("List", 4, function() {
	var mail1 = idbDao_test.testMails[0];
	var mail2 = idbDao_test.testMails[1];
	var mail3 = idbDao_test.testMails[2];

	// test listing the last two
	idbDao_test.idb.list('email', 0, 2, function(err, res) {
		ok(!err, 'list 2');
		deepEqual(res, [mail2, mail3]);

		// test listing all
		idbDao_test.idb.list('email', 0, null, function(err, res) {
			ok(!err, 'list all');
			deepEqual(res, [mail1, mail2, mail3]);

			start();
		});
	});
});

asyncTest("Batch", 3, function() {
	idbDao_test.idb.batch('email', idbDao_test.testMails, function(err) {
		ok(!err, 'read');

		// test listing all
		idbDao_test.idb.list('email', 0, null, function(err, res) {
			ok(!err, 'list all');
			deepEqual(res, idbDao_test.testMails);

			start();
		});
	});
});

asyncTest("Remove", 3, function() {
	idbDao_test.idb.remove('email', idbDao_test.testMails[6].sentDate, function(err) {
		ok(!err, 'read');

		// test listing all
		idbDao_test.idb.list('email', 0, null, function(err, res) {
			ok(!err, 'list all');
			equal(res.length, idbDao_test.testMails.length - 1);

			start();
		});
	});
});
